/**
 *  PseudoCode:
 *  -- determine today's date
 *  -- check if today is an exception or not (LATER)
 *  -- get all the users who want to be matched today:
 *    -- also find their previous matches:
 *  -- make matches
 *  -- reset all the users who wanted to skip their match today!
 *  -- send zulip message to all match pairs
 *  -- send message to admin folks the results of the match pairs!
 */
import { cloneDeep } from 'lodash';

// ===== REMOVE LATER ========
// LOCAL TESTING PURPOSE ONLY -- code runner doesn't set the process.env
process.env.PROD_DB = 'prod.db';
process.env.NODE_ENV = 'production';

import { UserWithPrevMatchRecord } from '../../db/models/user_model';
import { initDB } from '../../db';
import { createSuitorAcceptorPool } from './create-suitor-acceptor-pool';
import { makeStableMarriageMatches } from '../../matching-algo/stable-marriage-matching/stable-marriage-algo';
import { Acceptor } from '../../matching-algo/stable-marriage-matching/marriage-types';
import { sendGenericMessage } from '../../zulip-messenger/msg-sender';

type logDataType = {
  numMatches?: number;
  fallBackMatch?: any;
  emailsMatches?: Array<[string, string]>;
  suitors?: any;
  acceptors?: any;
};

export function makeMatches(sendMessages = false) {
  // TODO: move all variables into the log
  // const logData: logDataType = {};
  ////////////////////
  // Get Users to Match
  ////////////////////
  const usersToMatch: UserWithPrevMatchRecord[] = (() => {
    const db = initDB();
    // const today = new Date().getDay();
    const today = 2;
    return db.User.findUsersPrevMatchesToday(today);
  })();

  // ==== debugging =====
  // console.log(usersToMatch);
  const total_num_matches = usersToMatch.length;
  // console.log(`Total number of matches: ${total_num_matches}`);

  ////////////////////
  // Create Stable Marriage Pool
  ////////////////////
  const { suitors, acceptors, fallBackMatch } = (() => {
    const fallBackUser = {
      email: 'alicia@recurse.com',
      full_name: 'Alicia',
      prevMatches: []
    };

    return createSuitorAcceptorPool(usersToMatch, fallBackUser);
  })();

  // ====== debugging =====
  // console.log(`Fall back match: ${JSON.stringify(fallBackMatch)}`);
  // console.log(`Size of suitors: ${suitors.size}`);
  // console.log(`Size of acceptors: ${acceptors.size}`);

  const { emailMatches, acceptorSuitorMatches } = ((
    suitorPool,
    acceptorPool
  ) => {
    const _acceptorSuitorMatches = makeStableMarriageMatches(
      suitorPool,
      acceptorPool
    );

    const _emailMatches = _acceptorSuitorMatches.map(match => {
      return [match[0].data.email, match[1].data.email];
    });

    return {
      emailMatches: _emailMatches,
      acceptorSuitorMatches: _acceptorSuitorMatches
    };
  })(cloneDeep(suitors), cloneDeep(acceptors));

  ////////////////////
  // Test for the number of previous matches?
  ////////////////////
  let num_repeated_matches = 0;
  emailMatches.forEach(matchPair => {
    const acceptorEmail = matchPair[0];
    const suitorEmail = matchPair[1];
    const acceptorUserPrevMatches = (acceptors.get(acceptorEmail) as Acceptor<
      UserWithPrevMatchRecord
    >).data.prevMatches;

    acceptorUserPrevMatches.forEach(prev_match => {
      if (prev_match.email === suitorEmail) {
        num_repeated_matches += 1;
      }
    });
  });

  ////////////////////
  // Message each user their match
  ////////////////////

  if (sendMessages) {
    acceptorSuitorMatches.forEach(match => {
      const acceptor = match[0];
      const suitor = match[1];
      const acceptorMessage = `Hi there! 👋
      You've been matched today with @**${suitor.data.full_name}**`;
      const suitorMessage = `Hi there! 👋
      You've been matched today with @**${acceptor.data.full_name}**`;

      sendGenericMessage(acceptor.data.email, acceptorMessage);
      sendGenericMessage(suitor.data.email, suitorMessage);
    });
  }

  ////////////////////
  // Logging
  ////////////////////
  // ====== debugging =====
  console.log(emailMatches);
  console.log(emailMatches.length);
  console.log(`Total number of matches: ${total_num_matches}`);
  console.log(fallBackMatch);
  console.log(`Number of repeated matches: ${num_repeated_matches}`);
}

// IMPORTANT!!! 💣
// only pass in true to make Matches if you want to
// annoy and send a bunch of people matches since Im using the prod db!
makeMatches(false);
