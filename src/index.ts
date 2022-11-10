import axios from 'axios'
import consola from 'consola'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import session from 'express-session'
import grant from 'grant'
import hpp from 'hpp'
import helmet from 'helmet'
import util from 'util'

dotenv.config()

declare module 'express-session' {
  export interface SessionData {
    grant: any;
  }
}

const AppPort = 3000

const GrantConfig = {
  defaults: {
    origin: process.env.PUBLIC_URL as string,
    transport: 'session',
    prefix: '/oauth',
    state: true
  },
  twitter2: {
    key: process.env.TWITTER_KEY as string,
    secret: process.env.TWITTER_SECRET as string,
    scope: ['tweet.read', 'users.read'], // offline.access can be added if refresh_token is needed
    state: true,
    pkce: true,
    redirect_uri: `${process.env.PUBLIC_URL as string}/cb/twitter`,
    custom_params: {
      code_challenge: 'challenge',
      code_challenge_method: 'plain'
    },
  }
}

const app = express()

app.set('json spaces', 2)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(helmet())
app.use(hpp())
app.use(cors())
app.use(session({ secret: 'the important secret must be changed', saveUninitialized: true, resave: false }))
app.use(grant.express(GrantConfig))
app.listen(AppPort, () => {
  consola.ready({
    message: `Server listening on port ${AppPort}!`,
    badge: true,
  })
})

// Routes
app.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    res.status(200).json({ 
      status: 'Ok',
    })
  } catch (err) {
    console.log(err)
  }
})

app.get('/cb/twitter', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if(req.query.state !== req.session.grant.state) res.status(401).send('Something is wrong')

    console.log(util.inspect(req.query, false, null, true /* enable colors */))
    console.log(util.inspect(req.session.grant, false, null, true /* enable colors */))

    const keys = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      `code=${req.query.code}&grant_type=authorization_code&client_id=${GrantConfig.twitter2.key}&redirect_uri=${GrantConfig.twitter2.redirect_uri}&code_verifier=challenge`,
      {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      }
    )
    .then((res) => res.data)
    .catch((err) => err)
    
    const me = await axios.get('https://api.twitter.com/2/users/me?user.fields=created_at,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,url,username,verified,withheld', {
      headers: {
        'Authorization': `Bearer ${keys.access_token}`
      }
    }) 
    .then((res) => res.data)
    .catch((err) => err)

    const revoke = await axios.post(
      'https://api.twitter.com/2/oauth2/revoke',
      new URLSearchParams({
          'token': keys.access_token,
          'client_id': GrantConfig.twitter2.key
      }),
      {
          params: {
            token_type_hint: 'refresh_token'
          }
      }
    )
    .then((res) => res.data)
    .catch((err) => err)

    console.log(keys)
    console.log(me)
    console.log(revoke)

    res.status(200).json({ 
      status: 'Ok',
      data: me.data
    })
  } catch (err) {
    console.log(err)
  }
})
