export interface Page {
  id: string;
  name: string;
  about: string;
  followers_count: number;
  cover?: {
    source: string;
  };
  picture: {
    data: {
      url: string;
    };
  };
  published_posts?: {
    data: Post[];
    summary: {
      total_count: number;
    };
  };
  access_token?: string;

  // Newly added fields for comprehensive data
  link?: string;
  username?: string;
  category?: string;
  verification_status?: string;
  website?: string;
  location?: {
    city?: string;
    country?: string;
    street?: string;
    zip?: string;
  };
  phone?: string;
  emails?: string[];
}

export interface Post {
  id: string;
  message: string;
  created_time: string;
  permalink_url: string;
  insights: {
    data: Insight[];
  };
  attachments?: {
    data: Attachment[];
  }
}

export interface Attachment {
    media?: {
        image: {
            src: string;
        };
        source?: string; // For video URL
    }
    type: string;
    subattachments?: {
        data: Attachment[];
    }
}

export interface Insight {
  name: string;
  period: string;
  values: {
    value: number | { [key: string]: number };
  }[];
}

export interface ManagedPage {
  id: string;
  name: string;
  access_token: string;
}

export interface TokenProfile {
  token: string;
  user?: {
    id: string;
    name: string;
    picture: {
      data: {
        url: string;
      };
    };
  } | null;
  status: 'unchecked' | 'loading' | 'success' | 'error';
  pageCount: number;
  errorMessage?: string;
}