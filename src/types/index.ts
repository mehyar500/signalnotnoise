export interface BiasAnalysis {
  leftEmphasizes: string;
  rightEmphasizes: string;
  consistentAcrossAll: string;
  whatsMissing: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  publishedAt: string;
  sourceName: string;
  biasLabel: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'international';
  heatScore: number;
  substanceScore: number;
}

export interface Cluster {
  id: string;
  representativeHeadline: string;
  summary: string;
  topic: string;
  topicSlug: string;
  articleCount: number;
  sourceCount: number;
  sourceBreakdown: {
    left: number;
    center: number;
    right: number;
    international: number;
  };
  biasAnalysis: BiasAnalysis;
  heatScore: number;
  substanceScore: number;
  firstArticleAt: string;
  lastArticleAt: string;
  articles: Article[];
}

export interface DailyDigest {
  id: string;
  digestDate: string;
  summary: string;
  keyTopics: string[];
  closingLine: string;
  clusterCount: number;
  articleCount: number;
}

export interface Collection {
  id: string;
  title: string;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
  lastBookmarkAt?: string;
}

export interface CollectionDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  bookmarks: BookmarkWithCluster[];
}

export interface BookmarkWithCluster {
  bookmarkId: string;
  note?: string;
  bookmarkedAt: string;
  cluster: Cluster;
}

export interface Bookmark {
  id: string;
  collectionId: string;
  clusterId: string;
  note?: string;
  createdAt: string;
}

export interface BookmarkCheck {
  bookmarkId: string;
  collectionId: string;
  collectionTitle: string;
}
