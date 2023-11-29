const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const aws = require('aws-sdk')
// declare a new express app
const app = express()
app.use(
  bodyParser.json({
    verify: function (res, req, buf) {
      req.rawBody = buf.toString()
    },
  }),
)
app.use(awsServerlessExpressMiddleware.eventContext())
// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
})
const getStripeKey = async () => {
  const { Parameters } = await new aws.SSM()
    .getParameters({
      Names: ['stripe_key'].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
    .promise()
  return Parameters[0].Value
}
// post method
app.post('/webhook', async function (req, res) {
  const stripeKey = await getStripeKey()
  const stripe = require('stripe')(stripeKey)
  const customer = await stripe.customers.retrieve(
    req.body.data.object.customer,
  )
  const userEmail = customer.email
  const cognito = new aws.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
  })
  cognito.adminCreateUser(
    {
      UserPoolId: process.env.AUTH_MEMBERSHIPWEBSITE_USERPOOLID,
      Username: userEmail,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        {
          Name: 'email',
          Value: userEmail,
        },
      ],
      ValidationData: [
        {
          Name: 'email',
          Value: userEmail,
        },
      ],
    },
    function (err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log(data)
      }
    },
  )
})
app.listen(3000, function () {
  console.log('App started')
})
module.exports = app
