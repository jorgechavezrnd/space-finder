import { SNSEvent } from 'aws-lambda';

const webHookUrl = 'https://hooks.slack.com/services/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';

async function handler(event: SNSEvent, context: any) {
  for (const record of event.Records) {
    await fetch(webHookUrl, {
      method: 'POST',
      body: JSON.stringify({
        'text': `Huston, we have a problem: ${record.Sns.Message}`
      })
    });
  }
}

export { handler }
