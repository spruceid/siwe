import WalletConnect from '@walletconnect/web3-provider';
import { ethers } from 'ethers';
import Mousetrap from 'mousetrap';
import { SignatureType, SiweMessage } from 'siwe';

const enum Providers {
    METAMASK = 'metamask',
    WALLET_CONNECT = 'walletconnect',
}

//eslint-disable-next-line
const metamask = (window as any).ethereum;
let walletconnect: WalletConnect;

/**
 * We need these to remove/add the eventListeners
 */

const signIn = async (connector: Providers) => {
    let provider;

    /**
     * Connects to the wallet and starts a etherjs provider.
     */
    if (connector === 'metamask') {
        await metamask.request({
            method: 'eth_requestAccounts',
        });
        provider = new ethers.providers.Web3Provider(metamask);
    } else {
        /**
         * The Infura ID provided just for the sake of the demo, you'll need to replace
         * it if you want to go to production.
         */
        walletconnect = new WalletConnect({
            infuraId: '8fcacee838e04f31b6ec145eb98879c8',
        });
        walletconnect.enable();
        provider = new ethers.providers.Web3Provider(walletconnect);
    }

    const [address] = await provider.listAccounts();
    if (!address) {
        throw new Error('Address not found.');
    }

    /**
     * Try to resolve address ENS and updates the title accordingly.
     */
    const ens = await provider.lookupAddress(address);

    updateTitle(ens ?? address);

    /**
     * Gets a nonce from our backend, this will add this nonce to the session so
     * we can check it on sign in.
     */
    const nonce = await fetch('/api/nonce', { credentials: 'include' }).then((res) => res.text());

    /**
     * Creates the message object
     */
    const message = new SiweMessage({
        domain: 'localhost',
        address,
        chainId: `${await provider.getNetwork().then(({ chainId }) => chainId)}`,
        uri: 'https://localhost',
        version: '1',
        statement: 'SIWE Notepad Example',
        type: SignatureType.PERSONAL_SIGNATURE,
        nonce,
    });

    /**
     * Generates the message to be signed and uses the provider to ask for a signature
     */
    const signature = await provider.getSigner().signMessage(message.signMessage());
    message.signature = signature;

    /**
     * Calls our sign_in endpoint to validate the message, if successful it will
     * save the message in the session and allow the user to store his text
     */
    fetch(`/api/sign_in`, {
        method: 'POST',
        body: JSON.stringify({ message, ens }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    }).then(async (res) => {
        if (res.status === 200) {
            res.json().then(({ text, address, ens }) => {
                connectedState(text, address, ens);
                return;
            });
        } else {
            res.json().then((err) => {
                console.error(err);
            });
        }
    });
};

const signOut = async () => {
    updateTitle('Untitled');
    updateNotepad('');
    return fetch('/api/sign_out', {
        method: 'POST',
        credentials: 'include',
    }).then(() => disconnectedState());
};

/**
 * Saves the current content of our notepad
 */
const save = async (e?: Mousetrap.ExtendedKeyboardEvent) => {
    e?.preventDefault();
    if (!document.getElementById('walletconnect').classList.contains('hidden')) return;
    const text = (document.getElementById('notepad') as HTMLTextAreaElement).value;
    return fetch('/api/save', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
};

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Try to fetch user information and updates the state accordingly
     */
    fetch('/api/me', { credentials: 'include' }).then((res) => {
        if (res.status === 200) {
            res.json().then(({ text, address, ens }) => {
                connectedState(text, address, ens);
            });
        } else {
            /**
             * No session we need to enable signIn buttons
             */
            disconnectedState();
        }
    });

    /**
     * Bellow here are just helper functions to manage app state
     */
    const metamaskButton = document.getElementById('metamask');
    const walletConnectButton = document.getElementById('walletconnect');
    const disconnectButton = document.getElementById('disconnectButton');
    const toggleSize = document.getElementById('toggleSize');

    /**
     * If we don't have metamask installed hide the button.
     */
    if (typeof metamask === undefined) {
        metamaskButton.classList.add('hidden');
    }

    toggleSize.addEventListener('click', maximize);
    disconnectButton.addEventListener('click', signOut);
    metamaskButton.addEventListener('click', () => signIn(Providers.METAMASK));
    walletConnectButton.addEventListener('click', () => signIn(Providers.WALLET_CONNECT));
});

Mousetrap.bind('mod+s', save);

const connectedState = (text: string, address: string, ens: string) => {
    const metamaskButton = document.getElementById('metamask');
    const walletConnectButton = document.getElementById('walletconnect');
    const closeButton = document.getElementById('closeButton');
    const disconnectButton = document.getElementById('disconnectButton');
    const saveButton = document.getElementById('saveButton');

    /**
     * Updates fields and buttons
     */
    metamaskButton.classList.add('hidden');
    walletConnectButton.classList.add('hidden');
    closeButton.addEventListener('click', signOut);
    closeButton.removeAttribute('disabled');
    saveButton.addEventListener('click', save);
    saveButton.removeAttribute('disabled');
    disconnectButton.classList.remove('hidden');
    if (text) {
        updateNotepad(text);
    }
    updateTitle(ens ?? address);
};

const disconnectedState = () => {
    const metamaskButton = document.getElementById('metamask');
    const walletConnectButton = document.getElementById('walletconnect');
    const closeButton = document.getElementById('closeButton');
    const disconnectButton = document.getElementById('disconnectButton');
    const saveButton = document.getElementById('saveButton');

    if (typeof metamask !== undefined) {
        metamaskButton.classList.remove('hidden');
    }
    walletConnectButton.classList.remove('hidden');
    closeButton.removeEventListener('click', signOut);
    closeButton.setAttribute('disabled', 'disabled');
    saveButton.removeEventListener('click', save);
    saveButton.setAttribute('disabled', 'disabled');
    disconnectButton.classList.add('hidden');
};

const updateTitle = (text: string) => (document.getElementById('title').innerText = text);

const updateNotepad = (text: string) =>
    ((document.getElementById('notepad') as HTMLTextAreaElement).value = text);

const maximize = () => {
    const toggleSize = document.getElementById('toggleSize');
    const notepad = document.getElementById('notepad') as HTMLTextAreaElement;
    toggleSize.removeEventListener('click', maximize);
    toggleSize.addEventListener('click', restore);
    toggleSize.ariaLabel = 'Restore';
    notepad.style.width = '99.7vw';
    notepad.style.height = '91.7vh';
};

const restore = () => {
    const toggleSize = document.getElementById('toggleSize');
    const notepad = document.getElementById('notepad') as HTMLTextAreaElement;
    toggleSize.removeEventListener('click', restore);
    toggleSize.addEventListener('click', maximize);
    toggleSize.ariaLabel = 'Maximize';
    notepad.style.width = '460px';
    notepad.style.height = '320px';
};
