import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { Cluster, DailyDigest, Collection, CollectionDetail, Bookmark, BookmarkCheck } from '@/types';

interface GetClustersResponse {
  items: Cluster[];
  nextCursor: string | null;
}

interface SearchResponse {
  items: Cluster[];
}

interface BlindspotResponse {
  items: Cluster[];
  total: number;
}

interface Stats {
  activeSources: number;
  totalArticles: number;
  activeClusters: number;
  articlesLast24h: number;
  aiAvailable: boolean;
}

interface AdminSource {
  id: string;
  name: string;
  sub_source: string | null;
  feed_url: string;
  bias_label: string;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

interface FeedValidation {
  valid: boolean;
  itemCount: number;
  title: string | null;
  error: string | null;
}

interface BulkImportResult {
  inserted: number;
  skipped: number;
  failed: number;
  total: number;
  results: Array<{ name: string; url: string; status: string; error?: string; itemCount?: number }>;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Clusters', 'Digest', 'Stats', 'Collections', 'Bookmarks', 'AdminSources'],
  endpoints: (builder) => ({
    getClusters: builder.query<GetClustersResponse, { cursor?: string; limit?: number }>({
      query: ({ cursor, limit = 20 }) => {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        if (cursor) params.set('cursor', cursor);
        return `clusters?${params}`;
      },
      providesTags: ['Clusters'],
    }),
    getClusterDetail: builder.query<Cluster, string>({
      query: (id) => `clusters/${id}`,
    }),
    getBlindspotClusters: builder.query<BlindspotResponse, void>({
      query: () => 'clusters/blindspot',
      providesTags: ['Clusters'],
    }),
    getDigest: builder.query<DailyDigest | null, void>({
      query: () => 'digest',
      providesTags: ['Digest'],
    }),
    getStats: builder.query<Stats, void>({
      query: () => 'stats',
      providesTags: ['Stats'],
    }),
    triggerSync: builder.mutation<{ fetched: number; new: number; errors: number }, void>({
      query: () => ({ url: 'admin/sync', method: 'POST' }),
      invalidatesTags: ['Clusters', 'Stats'],
    }),
    triggerEnrich: builder.mutation<{ enriched: number }, void>({
      query: () => ({ url: 'admin/enrich', method: 'POST' }),
      invalidatesTags: ['Clusters'],
    }),
    triggerDigest: builder.mutation<{ created: boolean }, void>({
      query: () => ({ url: 'admin/digest', method: 'POST' }),
      invalidatesTags: ['Digest'],
    }),

    getCollections: builder.query<Collection[], void>({
      query: () => 'collections',
      providesTags: ['Collections'],
    }),
    getCollectionDetail: builder.query<CollectionDetail, string>({
      query: (id) => `collections/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Collections', id }],
    }),
    createCollection: builder.mutation<Collection, { title: string }>({
      query: (body) => ({ url: 'collections', method: 'POST', body }),
      invalidatesTags: ['Collections'],
    }),
    deleteCollection: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `collections/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Collections'],
    }),
    createBookmark: builder.mutation<Bookmark, { clusterId: string; collectionId: string; note?: string }>({
      query: (body) => ({ url: 'bookmarks', method: 'POST', body }),
      invalidatesTags: ['Collections', 'Bookmarks'],
    }),
    deleteBookmark: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `bookmarks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Collections', 'Bookmarks'],
    }),
    checkBookmarks: builder.query<BookmarkCheck[], string>({
      query: (clusterId) => `bookmarks/check/${clusterId}`,
      providesTags: ['Bookmarks'],
    }),
    searchClusters: builder.query<SearchResponse, { q?: string; bias?: string; limit?: number }>({
      query: ({ q, bias, limit = 20 }) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (bias) params.set('bias', bias);
        params.set('limit', String(limit));
        return `search?${params}`;
      },
    }),

    getAdminSources: builder.query<{ sources: AdminSource[]; total: number }, void>({
      query: () => 'admin/sources',
      providesTags: ['AdminSources'],
    }),
    addSource: builder.mutation<{ source: AdminSource; validation: FeedValidation }, { name: string; feedUrl: string; biasLabel?: string; subSource?: string }>({
      query: (body) => ({ url: 'admin/sources', method: 'POST', body }),
      invalidatesTags: ['AdminSources', 'Stats'],
    }),
    bulkImportSources: builder.mutation<BulkImportResult, { sources: Array<{ name: string; feedUrl: string; biasLabel?: string; subSource?: string }> }>({
      query: (body) => ({ url: 'admin/sources/bulk', method: 'POST', body }),
      invalidatesTags: ['AdminSources', 'Stats'],
    }),
    importSourceFile: builder.mutation<BulkImportResult, { filePath: string; biasMap?: Record<string, string> }>({
      query: (body) => ({ url: 'admin/sources/import-file', method: 'POST', body }),
      invalidatesTags: ['AdminSources', 'Stats'],
    }),
    updateSource: builder.mutation<{ source: AdminSource }, { id: string; name?: string; biasLabel?: string; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `admin/sources/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminSources'],
    }),
    deleteSource: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `admin/sources/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminSources', 'Stats'],
    }),
    validateFeed: builder.mutation<FeedValidation, { feedUrl: string }>({
      query: (body) => ({ url: 'admin/sources/validate', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetClustersQuery,
  useGetClusterDetailQuery,
  useGetBlindspotClustersQuery,
  useGetDigestQuery,
  useGetStatsQuery,
  useTriggerSyncMutation,
  useTriggerEnrichMutation,
  useTriggerDigestMutation,
  useGetCollectionsQuery,
  useGetCollectionDetailQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useCheckBookmarksQuery,
  useSearchClustersQuery,
  useGetAdminSourcesQuery,
  useAddSourceMutation,
  useBulkImportSourcesMutation,
  useImportSourceFileMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useValidateFeedMutation,
} = api;
