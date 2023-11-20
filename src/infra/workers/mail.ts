import { Queue, Worker } from 'bullmq';
import { ServerClient } from 'postmark';

import { envVariables } from '../../lib/env';
import { sharedRedisConnection } from './redisConnection';

const client = new ServerClient(envVariables.POSTMARK_API_KEY);
type ReturnedData = Awaited<ReturnType<typeof client.sendEmailWithTemplate>>;

const emailTemplateIds = {
  welcome: 'welcome',
} as const;

type QueueData = {
  to: string;
  from: string;
  templateKey: keyof typeof emailTemplateIds;
};

export const emailQueue = new Queue<QueueData, ReturnedData, 'email'>('email', {
  connection: sharedRedisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
  },
});

new Worker<QueueData, ReturnedData, 'email'>(
  'email',
  (job) => {
    return client.sendEmailWithTemplate({
      From: job.data.from,
      To: job.data.to,
      TemplateAlias: emailTemplateIds[job.data.templateKey],
      TemplateModel: {
        product_url: 'product_url_Value',
        product_name: 'product_name_Value',
        name: 'name_Value',
        action_url: 'action_url_Value',
        login_url: 'login_url_Value',
        username: 'username_Value',
        trial_length: 'trial_length_Value',
        trial_start_date: 'trial_start_date_Value',
        trial_end_date: 'trial_end_date_Value',
        support_email: 'support_email_Value',
        live_chat_url: 'live_chat_url_Value',
        sender_name: 'sender_name_Value',
        help_url: 'help_url_Value',
        company_name: 'company_name_Value',
        company_address: 'company_address_Value',
      },
    });
  },
  {
    removeOnComplete: {
      count: 10,
    },
    connection: sharedRedisConnection,
  },
);
