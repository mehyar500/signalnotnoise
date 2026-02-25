import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { MOCK_CLUSTERS, MOCK_DIGEST } from './mockData';
import type { Cluster, DailyDigest } from '@/types';

interface GetClustersResponse {
  items: Cluster[];
  nextCursor: string | null;
}

const ITEMS_PER_PAGE = 5;

function getClusters(cursor?: string): GetClustersResponse {
  const startIndex = cursor ? MOCK_CLUSTERS.findIndex(c => c.id === cursor) + 1 : 0;
  const items = MOCK_CLUSTERS.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const nextCursor =
    startIndex + ITEMS_PER_PAGE < MOCK_CLUSTERS.length
      ? (items[items.length - 1]?.id ?? null)
      : null;
  return { items, nextCursor };
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
    getClusters: builder.query<GetClustersResponse, { cursor?: string }>({
      queryFn: ({ cursor }) => {
        return { data: getClusters(cursor) };
      },
    }),
    getClusterDetail: builder.query<Cluster, string>({
      queryFn: (id) => {
        const cluster = MOCK_CLUSTERS.find(c => c.id === id);
        if (!cluster) return { error: { status: 404, error: 'Not found' } as const };
        return { data: cluster };
      },
    }),
    getDigest: builder.query<DailyDigest, void>({
      queryFn: () => {
        return { data: MOCK_DIGEST };
      },
    }),
  }),
});

export const { useGetClustersQuery, useGetClusterDetailQuery, useGetDigestQuery } = api;
