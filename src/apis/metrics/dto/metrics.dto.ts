export class GetMetricsResponseDto {
  metrics: {
    overview: {
      totalEmails: number;
      totalContacts: number;
      totalBroadcasts: number;
      totalTemplates: number;
      totalDomains: number;
      totalWebhooks: number;
    };
    emailStats: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      failed: number;
      openRate: number;
      clickRate: number;
      bounceRate: number;
    };
    contactStats: {
      total: number;
      subscribed: number;
      unsubscribed: number;
      bounced: number;
      newThisMonth: number;
      activeThisMonth: number;
    };
    broadcastStats: {
      total: number;
      sent: number;
      scheduled: number;
      draft: number;
      totalRecipients: number;
      totalOpens: number;
      totalClicks: number;
      averageOpenRate: number;
      averageClickRate: number;
    };
    period: {
      start: string;
      end: string;
    };
  };
}
