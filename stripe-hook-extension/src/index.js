import express from 'express';
import Stripe from 'stripe';

export default ({ filter, action, init }, { exceptions, services }) => {
	const { InvalidPayloadException, } = exceptions;
	const { ItemsService } = services;
	let paymentIntent;

	filter('orders.items.create', async (input, { collection }, { schema, database }) => {
		if (collection !== 'orders') return input;
		const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
		const productService = new ItemsService('products', {
			schema,
			knex: database,
			accountability: {
				admin: true,
				ip: '127.0.0.1'
			},
		});

		const product = await productService.readOne(input.product);

		try {
			paymentIntent = await stripe.paymentIntents.create({
				amount: product.price,
				currency: 'eur',
				// Stripe dashboard description
				description: product.name,
				payment_method_types: ['card'],
				// Bank record. 22 chars max.
				statement_descriptor: 'From company',
				// Customer info
				metadata: {
					user: input.user,
				},
			});
			input.payment_intent = paymentIntent.client_secret;
			input.stripe_id = paymentIntent.id;
		} catch (err) {
			throw new InvalidPayloadException(err.message);
		}
		return input;
	})

	action('orders.items.create', async (meta, { schema, database }) => {
		try {
			const paidService = new ItemsService('paids', {
				schema,
				knex: database,
				accountability: {
					admin: true,
					ip: '127.0.0.1'
				},
			});
			await paidService.createOne({
				'paid': false,
				'order': meta.key,
			});
		}
		catch (err) {
			throw new InvalidPayloadException(err.message);
		}
	});

	init('middlewares.before', async function ({ app }) {
		app.use(
			express.json({
				verify: (req, res, buf) => {
					if (req.originalUrl.startsWith('/stripe/webhook'))
						req.rawBody = buf.toString();
				},
			})
		);
	});
};
