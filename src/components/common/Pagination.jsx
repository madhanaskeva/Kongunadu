import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SelectField } from './SelectField';

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

const pageBtn = (active, disabled) => ({
  all: 'unset',
  cursor: disabled ? 'default' : 'pointer',
  boxSizing: 'border-box',
  minWidth: '36px',
  height: '36px',
  padding: '0 8px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 700,
  border: `1px solid ${active ? 'var(--kr-green-700)' : '#d5dfda'}`,
  background: active ? 'var(--kr-green-700)' : '#fff',
  color: active ? '#fff' : disabled ? 'var(--kr-grey-300)' : 'var(--text-heading)',
});

const sizeSelect = {
  width: '110px',
  height: '36px',
  boxSizing: 'border-box',
  padding: '0 30px 0 12px',
  appearance: 'none',
  WebkitAppearance: 'none',
  borderRadius: '10px',
  border: '1px solid #d5dfda',
  background: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-heading)',
  cursor: 'pointer',
};

// Page numbers to show: all of them when few, otherwise first, last and the
// neighbours of the current page with '…' gaps.
const pageList = (cur, count) => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach(n => set.add(n));
  if (cur >= count - 2) [count - 3, count - 2, count - 1].forEach(n => set.add(n));
  const nums = [...set].filter(n => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('gap' + n); out.push(n); });
  return out;
};

export const Pagination = ({
  page,
  pageCount,
  pageSize,
  total,
  setPage,
  setPageSize,
  noun = 'records',
  sizes = [10, 25, 50],
  style,
}) => {
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '14px 20px',
        borderTop: '1px solid #e3e9e6',
        fontSize: '13px',
        color: 'var(--text-muted)',
        ...style,
      }}
    >
      <span>Showing {first} to {last} of {total} {noun}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page" style={pageBtn(false, page === 1)}>
          <ChevronLeft size={18} />
        </button>
        {pageList(page, pageCount).map(n =>
          typeof n === 'string' ? (
            <span key={n} style={{ minWidth: '20px', textAlign: 'center' }}>…</span>
          ) : (
            <button key={n} onClick={() => setPage(n)} aria-current={n === page ? 'page' : undefined} style={pageBtn(n === page, false)}>
              {n}
            </button>
          )
        )}
        <button disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Next page" style={pageBtn(false, page === pageCount)}>
          <ChevronRight size={18} />
        </button>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
          <SelectField
            value={pageSize}
            onChange={(v) => setPageSize(Number(v))}
            options={sizes.map(n => ({ value: n, label: `${n} / page` }))}
            ariaLabel="Rows per page"
            width="128px"
            height={36}
          />
        </div>
      </div>
    </div>
  );
};

export default Pagination;
