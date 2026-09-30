import React, { useEffect, useState } from 'react';
import { Flex, Pagination as AntPagination, Typography } from 'antd';

/**
 * Client-side paging for a table's rows.
 *
 *   const pg = usePagination(rows, [filterA, filterB]);
 *   pg.rows            → rows for the current page
 *   <Pagination {...pg} noun="trips" />
 *
 * `resetKeys` sends the table back to page 1 whenever a filter changes.
 */
export const usePagination = (items = [], resetKeys = [], initialSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [pageSize, ...resetKeys]);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const curPage = Math.min(page, pageCount);
  return {
    rows: items.slice((curPage - 1) * pageSize, curPage * pageSize),
    page: curPage,
    pageCount,
    pageSize,
    total,
    setPage,
    setPageSize,
  };
};

const pageSizeList = (sizes) => {
  const raw = Array.isArray(sizes) && sizes.length > 0 ? sizes : [10, 20, 50, 100];
  return Array.from(new Set([10, ...raw])).sort((a, b) => a - b);
};

/**
 * The antd pagination props for a usePagination() result.
 */
export const antPaginationProps = ({ page, pageSize = 10, total, setPage, setPageSize, sizes }) => ({
  current: page,
  pageSize,
  total,
  showSizeChanger: true,
  pageSizeOptions: pageSizeList(sizes).map(String),
  onChange: (p, size) => {
    if (size !== pageSize) setPageSize(Number(size));
    else setPage(p);
  },
});

export const showingText = ({ page, pageSize = 10, total }, noun = 'records') => {
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return `Showing ${first} to ${last} of ${total} ${noun}`;
};

export const Pagination = ({
  page,
  pageSize = 10,
  total,
  setPage,
  setPageSize,
  noun = 'records',
  sizes,
  style,
}) => {
  const pg = { page, pageSize: pageSize || 10, total, setPage, setPageSize, sizes };
  return (
    <Flex justify="space-between" align="center" gap={12} wrap className="tms-pagination" style={style}>
      <Typography.Text type="secondary">{showingText(pg, noun)}</Typography.Text>
      <AntPagination {...antPaginationProps(pg)} />
    </Flex>
  );
};

export default Pagination;
