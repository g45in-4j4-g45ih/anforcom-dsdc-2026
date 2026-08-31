export type ForumPostType = "discussion" | "request";

export interface ForumThread {
  id: number;
  post_type: ForumPostType;
  title: string;
  content: string;
  author_name: string;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ForumThreadDetail extends ForumThread {
  replies: ForumReply[];
}

export interface ForumThreadFilters {
  type?: ForumPostType;
  search?: string;
}

export interface ForumThreadInput {
  post_type: ForumPostType;
  title: string;
  content: string;
}
