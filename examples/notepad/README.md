# Sign-In with Ethereum Notepad Example
Example usage of the Sign-In with Ethereum (SIWE) library

# Running
At the top of the `src/index.ts` file there is a variable that is the default port
used, if you want to use the provided Infura ID select one of the following ports,
`3000`,`3010`,`4000`,`4010`,`4361`,`9080`, otherwise you'll be unable to connect 
to Infura.

## Install the dependencies
```bash
npm i
```

## Create a `.env`
Copy the `.env.example` file and change some fields if you want.

## Run
```bash
npm run dev
```

## Play around
Open your browser at `http://localhost:4361` and have fun!

Select one of the providers available (Metamask, WalletConnect) to begin a SIWE
session. Write anything you want and hit the Save button (it's the start menu),
you can also hit Cmd+s/Ctrl+s if you want, refresh the page, close the tab, 
just don't delete your cookie and your text will be there until you decide to 
delete the folder `/db`, where the sessions are stored.

![Sign-In with Ethereum Notepad](./notepad.png "Sign-In with Ethereum Notepad")
