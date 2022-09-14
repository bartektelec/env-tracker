
const TIME_OFFSET = 2 * 60 * 60 * 1000;
const getParsedTime = (t) => String(new Date(t + TIME_OFFSET).getHours()).padStart(2,"0") + ":" + String(new Date(t + TIME_OFFSET).getMinutes()).padStart(2,"0");


module.exports = (state) =>  {
  
  
 const blocks =  [
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": `🧪 Env tracker - ${getParsedTime(Date.now())}`,
				"emoji": true
			}
		},
     {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Type */lock [project] [env] [minutes (default: 30)]* to lock`,
        }
      },
     {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Type */unlock [project] [env]* to unlock`,
        }
      },
 ]
 
 
 Object.entries(state).forEach(([pKey, pVal]) => {
   
   const section = {
     
			"type": "section",
			"fields": [
				{
					"type": "mrkdwn",
					"text": `*${pKey}*`
				},
				{
					"type": "mrkdwn",
					"text": "*Status*"
				}],
   };
   
   const now = Date.now();
   
   
   Object.entries(pVal).forEach(([eKey, eVal]) => {
     
       section.fields.push({
					"type": "plain_text",
					"text": eKey,
					"emoji": true
				});
     
       section.fields.push({
					"type": "plain_text",
					"text": `${eVal.busy ? "🔴 " : "🟢 Free"}` + `${eVal.busy ? `${eVal.user} until ${getParsedTime(eVal.timestamp)} (getParsedTime(eVal.timestamp - now) remaining)` : ""}`,
					"emoji": true
				});
   })

   
   
   blocks.push(section);
   
   blocks.push({type: "divider"});
   
 });
  
  blocks.push({
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Refresh",
						"emoji": true
					},
					"value": "true",
					"action_id": "refresh"
				}
			]
		})
		
 return ({blocks});
}