const stripe = require('stripe');
import express from 'express';

export default (router, { services, exceptions }) => {
	const { ItemsService } = services;
	const { ServiceUnavailableException } = exceptions;

	router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
		console.log('sanity');
		const sig = req.headers['stripe-signature'];
		let event;
		try {
			event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
		} catch (err) {
			console.log(err);
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		const orderService = new ItemsService('orders', {
			schema: req.schema,
			accountability: req.accountability
		});

		const paidService = new ItemsService('paids', {
			schema: req.schema,
			accountability: {
				...req.accountability,
				admin: true,
			}
		});
		const data = event.data;
		const object = data.object;
		if (object.status === "succeeded" && object.object === "charge") {
			console.log(object.payment_intent);
			try {
				const order = await orderService.readByQuery({
					filter: {
						"stripe_id": { _eq: object.payment_intent }
					},
					fields: ["*"]
				})
				if (order.length > 0) {
					console.log("order");
					console.log(order[0].id);
					const paid = await paidService.readByQuery({
						filter: {
							"order": { _eq: order[0].id }
						},
						fields: ["*"]
					});
					if (paid.length > 0) {
						await paidService.updateOne(paid[0].id, {
							"paid": true
						});
					}
				}
			} catch (error) {
				console.log(error);
				return next(new ServiceUnavailableException(error.message));
			}
			console.log("success");
		}
	});

	router.get('/', (req, res) => {
		res.send('Hello World!');
	});
};
