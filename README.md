# Example of Stripe implementation on Directus

## 🐰Introduction

My goal is to present you with an example of implementation of [Stripe](https://stripe.com/) on [Directus](https://github.com/directus/directus) it's a bit complicated for the beginners but I hope you will enjoy it.

I stay open for any feedback or suggestions.

## ⚙️ Account admin of Directus
id : admin@sysdraw.fr

mdp : sysdraw

## Configuration of project
In the file `directus-stripe/.env` replace the variables :

`DB_FILENAME=` with the name path of folder by example :

```
DB_FILENAME="C:\Users\admin\Documents\directus-stripe\data.db"
```

``STRIPE_PUBLIC_KEY=`` with your public key Stripe

``STRIPE_SECRET_KEY=`` with your private key Stripe

``STRIPE_WEBHOOK_SECRET=`` with your webhook secret Stripe

With your terminal :
```
stripe listen --forward-to localhost:8055/stripe/webhook
```