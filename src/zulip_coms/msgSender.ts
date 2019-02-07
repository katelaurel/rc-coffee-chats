/**
 * This module is responsible for sending messages to end user
 * sent from our server --> bot/zulip server
 */

import axios from 'axios';
import { ICliAction } from './interface';

// TODO: make a sendMessage (takes in message type etc.)
export enum messageType {
  'PROMPT_SIGNUP',
  'SIGNUP',

  // CLI Update-related cmds
  'UPDATE_DAYS',
  'UPDATE_SKIP',
  'UPDATE_WARNINGS',

  // CLI Get-related cmds
  'STATUS_DAYS',
  'STATUS_SKIP',
  'STATUS_WARNINGS'
}
export interface IMsgSenderArgs {
  status: 'OK' | 'ERROR';
  messageType: messageType;
  payload?: any;
  message?: string;
  cliAction?: ICliAction;
}

export function zulipMsgSender(
  toEmail: string | string[],
  msgOpt: IMsgSenderArgs
): void {
  let messageContent;
  switch (msgOpt.messageType) {
    case messageType.PROMPT_SIGNUP:
      messageContent = `You are not currently signed up as a user of coffee chats
      Type SIGNUP to join`;
      break;

    case messageType.SIGNUP:
      if (msgOpt.status === 'OK') {
        messageContent = `You've successfully been added to coffee chat!
        Type HELP or learn more at []()`;
      } else {
        messageContent = `Failed to sign you up`;
      }
      break;

    case messageType.STATUS_DAYS:
      const daysAsString = msgOpt.payload.join(' ');
      messageContent = `You've successfully set your days to be: ${daysAsString}`;
      break;

    default:
      if (msgOpt.status === 'ERROR') {
        messageContent = `ERROR: 
        payload: ${msgOpt.payload}
        message: ${msgOpt.message}
        cli: ${msgOpt.cliAction}
        `;
      } else {
        messageContent = `OK: 
        payload: ${msgOpt.payload}
        message: ${msgOpt.message}
        `;
      }

      break;
  }

  sendGenericMessage(toEmail, messageContent);
}

export function sendGenericMessage(
  toEmail: string | string[],
  messageContent: string
) {
  // example: link See [${matchedName.split(" ")[0]}'s profile](https://www.recurse.com/directory?q=${encodeURIComponent(matchedName)})
  // const testMessage = `Hi you're @**Alan Chu (W1\'18)** my name is *coffee-bot*`;
  const rawData = {
    type: 'private',
    to: toEmail instanceof Array ? toEmail.join(', ') : toEmail,
    content: encodeURIComponent(messageContent)
  };

  const dataAsQueryParams = Object.keys(rawData)
    .map(key => `${key}=${rawData[key]}`)
    .join('&');

  return axios({
    method: 'post',
    baseURL: process.env.ZULIP_URL_ENDPOINT,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: process.env.ZULIP_BOT_USERNAME,
      password: process.env.ZULIP_BOT_API_KEY
    },
    data: dataAsQueryParams
  });
}
