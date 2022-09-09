// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const createEnv = () => ({
    user: "",
    busy: false,
    timestamp: 0
  })
const TIME_OFFSET = 2 * 60 * 60 * 1000;


const projects = ['pg', 'pg.client', 'pg.hosting.client'];
const envs = ['dev', 'staging'];

let store = projects.reduce((acc, curr) => ({...acc, [curr]: 
                                            envs.reduce((acc,curr) => ({...acc, [curr]: createEnv()}),{})
                                           }) ,{})

const getParsedTime = (t) => new Date(t).getHours() + ":" + new Date(t).getMinutes()
const getEnvStatus = (p, e) => `🧪*${e}*: ${store[p][e].busy ? `Taken by ${store[p][e].user} until ${getParsedTime(store[p][e].timestamp)}` : "Free"}`;
const getProjectStatus = (p) =>  `ℹ️ ${p}` + "\n" + envs.map(e => getEnvStatus(p,e)).join("\n");

const getCurrentStatus = () => "〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n‼️ Current status ‼️ \n〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n" + projects.map(getProjectStatus).join("\n---------\n");

app.command('/lock', async ({ command, ack, client, say }) => {
  // Acknowledge command request
  ack();
  console.log(command);
  
  const args = command.text.split(" ");
  
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

    
  store[_project][_env].user = command.user_name;
  store[_project][_env].busy = true;
  store[_project][_env].timestamp = Date.now() + (_time * 1000 * 60) + TIME_OFFSET;
  
  const current = store[_project][_env];
  
  await say(`⚠️ ${_project}/${_env} is *locked* by ${current.user} until ${getParsedTime(current.timestamp)}`);
  await say(getCurrentStatus());
});


app.command('/unlock', async ({ command, ack, say }) => {
  // Acknowledge command request
  ack();
  console.log(command.text);
  console.log('Hey now');
});
// All the room in the world for your code



(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
