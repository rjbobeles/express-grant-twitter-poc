# OAuth flow with Express and Grant POC

## Setup
1. Get an OAuth2 client id and secret from twitter
2. Make a copy of `.env.sample` as `.env`
3. Fill in `TWITTER_KEY` and `TWITTER_SECRET` in `.env`
4. Get a service like light tunnel or ngrok to get a publicly accessible url
5. Fill in `PUBLIC_URL` in `.env` with the url you obtained
6. Change website url to `PUBLIC_URL` in the App info
7. Change callback url to `PUBLIC_URL/cb/twitter` in the App info

If you didn't already, do a `yarn install` and `yarn run dev` to get the service up and running
