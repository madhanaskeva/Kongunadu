import React, { useState, useMemo } from 'react';
import { Button, Divider, Flex, Select, Typography } from 'antd';
import { useDebounce } from '../../../../utils/debounce';

/**
 * Compact multi-choice dropdown (antd Select mode="multiple") with live search,
 * select-all/clear shortcuts and a Done action. antd handles popup placement.
 *
 * Contract (unchanged): values ([] | value), options ([string] | [{ value, label }]),
 * onChange(nextArray), placeholder, fieldName, style, disabled.
 */
export const ReportMultiSelect = ({
  values = [],
  options = [],
  onChange,
  placeholder = 'Select…',
  fieldName = 'Choice',
  style,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Normalize selected values to an array
  const selectedList = useMemo(() => {
    if (Array.isArray(values)) return values;
    if (values != null && values !== '') return [values];
    return [];
  }, [values]);

  // Normalize options to [{ value, label }]
  const normalizedOptions = useMemo(() => {
    return options.map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

  // Filter options based on live search
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return normalizedOptions;
    const q = debouncedSearchQuery.trim().toLowerCase();
    return normalizedOptions.filter(o =>
      String(o.label).toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, debouncedSearchQuery]);

  // Select all currently visible/filtered options
  const handleSelectAll = () => {
    const toAdd = filteredOptions.map(o => o.value);
    const combined = Array.from(new Set([...selectedList, ...toAdd]));
    onChange(combined);
  };

  // Clear all selections
  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  return (
    <Select
      mode="multiple"
      value={selectedList}
      options={filteredOptions}
      onChange={(next) => onChange(next || [])}
      placeholder={placeholder}
      disabled={disabled}
      allowClear
      open={open}
      onOpenChange={setOpen}
      maxTagCount="responsive"
      maxTagPlaceholder={(omitted) => `+ ${omitted.length} more`}
      // clean off trailing phone/id in trigger for brevity
      labelRender={(item) => String(item.label ?? item.value).replace(/\s*\([^)]*\)$/, '')}
      showSearch={{
        searchValue: searchQuery,
        onSearch: setSearchQuery,
        filterOption: false,
        autoClearSearchValue: false,
      }}
      listHeight={240}
      notFoundContent={`No matching ${fieldName.toLowerCase()} found.`}
      popupRender={(menu) => (
        <>
          <Flex justify="space-between" align="center" style={{ padding: '0 4px' }}>
            <Flex align="center">
              <Button type="link" size="small" onClick={handleSelectAll}>
                Select all
              </Button>
              <Divider orientation="vertical" />
              <Button type="text" size="small" onClick={handleClearAll}>
                Clear all
              </Button>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {selectedList.length} of {normalizedOptions.length}
            </Typography.Text>
          </Flex>
          <Divider style={{ margin: '4px 0' }} />
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <Flex justify="flex-end" style={{ padding: '0 4px 4px' }}>
            <Button type="primary" size="small" onClick={() => setOpen(false)}>
              Done
            </Button>
          </Flex>
        </>
      )}
      style={{ width: '100%', ...style }}
    />
  );
};

export default ReportMultiSelect;
