// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const getMessage = require('./getMessage.js');
const dbclient = require('./db.js');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const initDb = async () => {
  await dbclient.connect();
  
//   for await(const p of projects) {
    
//     for await(const e of envs) {
      
//       await dbclient.hSet(p, e, JSON.stringify(createEnv()));
       
//     }
    
//   }
  
  
  await getFromDB();
  
  
}

const getFromDB = async () => {
  store = JSON.parse(await dbclient.get('store'));
}

const saveToDB = async () => {
  await dbclient.set('store', JSON.stringify(store));
}


const TIME_OFFSET = 2 * 60 * 60 * 1000;

const separator = "\n〰️〰️〰️〰️〰️〰️\n";


const projects = ['pg', 'pg.client', 'pg.hosting.client'];
const envs = ['dev', 'staging'];

let store = {};

initDb();

const getParsedTime = (t) => String(new Date(t + TIME_OFFSET).getHours()).padStart(2,"0") + ":" + String(new Date(t + TIME_OFFSET).getMinutes()).padStart(2,"0")
const getEnvStatus = (p, e) => `🧪 *${e}*: ${store[p][e].busy ? `🔒 Locked by ${store[p][e].user} until ${getParsedTime(store[p][e].timestamp)} - (${getMinutesRemaining(store[p][e].timestamp)} minutes left)` : "🔓 Free"}`;
const getProjectStatus = (p) =>  `ℹ️ ${p}` + "\n" + envs.map(e => getEnvStatus(p,e)).join("\n");

const getMinutesRemaining = (t) => Math.floor((t - Date.now()) / 60000);

const getCurrentStatus = () => separator + "‼️ Current status ‼️" + separator + projects.map(getProjectStatus).join(separator);

const updateAllStates = async () => {
  await getFromDB();
  
  
  Object.entries(store).forEach(([key, val]) => {
    
    Object.entries(val).forEach(([eKey, eVal]) => {
      
        if(Date.now() >= eVal.timestamp) {
          eVal.busy = false;
          eVal.timestamp = 0;
          eVal.user = "";
        }
      
    })
    
  })
  
  await saveToDB();
}

app.command('/lock', async ({ command, ack, client, say }) => {
  // Acknowledge command request
  ack();
  
  await lock(command.text, command.user_name, say);
});

const lock = async (argString, user_name, say) => {
  await updateAllStates();
  
  const args = argString.split(" ");
  
  if(args.length < 2) {
    say("❌ Specify project, env");
    return;
  }
  
  const [_project, _env, _time = 30] = args;
  
  
  if(!store[_project]) {
    await say(`❌ I dont know this project: ${_project}`);
    return;
  }
  
  if(!store[_project][_env]) {
    await say(`❌ ${_project} doesn't have env called ${_env}`);
    return;
  }
  
  const current = store[_project][_env];
  
  if(current.busy && current.user !== user_name) {
    await say(`❌🔒 Sorry, ${_project}/${_env} is currently locked by @${current.user} until ${getParsedTime(current.timestamp)}. Try again later or ask them to unlock.`);
    return;
  }
    
  current.user = user_name;
  current.busy = true;
  current.timestamp = Date.now() + (_time * 1000 * 60);
  
  await say(`✅🔒 ${_project}/${_env} is now *locked* by @${current.user} until ${getParsedTime(current.timestamp)}`);
  await saveToDB();
  await say(getMessage(store));
}

app.action("overflow-action", async ({ack, payload, action, say}) => {
  ack();

  console.log('action', payload);
  
  await lock(action.selected_option.value, "bartek", say);
  say("Clicked");
})

app.action("refresh", async ({ack, say, action}) => {
  ack();
  await updateAllStates();
  
  
  await say(getMessage(store));
})


app.command('/unlock', async ({ command, ack, say }) => {
  await updateAllStates();
  // Acknowledge command request
  ack();
  
  const {user_name, text} = command;
  
  const [p, e] = text.split(" ");
  
  if(!e) {
    await say(`❌ Which env do you want to unlock, ${user_name}?`);
    return;
  };
  
    if(!p) {
    await say(`❌ Which project and env do you want to unlock, ${user_name}?`);
    return;
  }
  
  const current = store[p][e];
  
  if(current.user !== user_name) {
    await say(`❌ This project/env is not locked by you ${user_name}, ask ${current.user} to unlock it`);
    return;
  }
  
  current.user = "";
  current.busy = false;
  current.timestamp = 0;
  await updateAllStates();
  
  await say(getMessage(store))
  
});

app.command('/info', async ({ command, ack, say }) => {
  // Acknowledge command request
  ack();
  await updateAllStates();
  
  if(!command.text) {
    await say(getCurrentStatus());
    return;
  }
  
  const [_project, _env] = command.text.split(" ");
  
  if(!_env) {
    await say(getProjectStatus(_project));
    return;
  }
  
  await say(getEnvStatus(_project, _env));
  
});
// All the room in the world for your code



(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
