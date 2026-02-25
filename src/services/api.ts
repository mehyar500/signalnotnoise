import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Cluster, DailyDigest, Collection, CollectionDetail, Bookmark, BookmarkCheck } from '@/types';

interface GetClustersResponse {
  items: Cluster[];
  nextCursor: string | null;
}

interface Stats {
  activeSources: number;
  totalArticles: number;
  activeClusters: number;
  articlesLast24h: number;
  aiAvailable: boolean;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Clusters', 'Digest', 'Stats', 'Collections', 'Bookmarks'],
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
  }),
});

export const {
  useGetClustersQuery,
  useGetClusterDetailQuery,
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
} = api;
