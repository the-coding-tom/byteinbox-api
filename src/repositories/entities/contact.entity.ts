export class CreateContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  teamId: number;
  createdBy?: number;
  audienceId: number;
}

export class ContactData {
  id: string;
}

export class UpdateContactData {
  firstName?: string;
  lastName?: string;
  status?: string;
}

export class ContactListData {
  id: number;
  reference: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  unsubscribed: boolean;
}
