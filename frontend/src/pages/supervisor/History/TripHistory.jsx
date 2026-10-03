import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Avatar, Badge, Button, Card, Checkbox, Collapse, DatePicker, Divider, Empty, Flex, Form, Tag, Typography } from 'antd';
import { Calendar, ChevronDown, Clock, Eraser, X } from 'lucide-react';

const { Text } = Typography;

// Native <input type="date"> handed "YYYY-MM-DD" strings to the handlers; the pickers keep that contract.
const ISO = 'YYYY-MM-DD';
const toDay = (s) => (s ? dayjs(s, ISO) : null);
const asDateEvent = (d) => ({ target: { value: d ? d.format(ISO) : '' } });

export const TripHistory = ({ v }) => {
  const [openCards, setOpenCards] = useState({});

  const toggleCard = (id, e) => {
    if (e) e.stopPropagation();
    setOpenCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <Flex vertical gap={12} style={{ flex: 1, padding: 16 }}>
        <Form layout="vertical" component={false}>
          <Flex vertical gap={10} className="sv-hist-filters" style={{ position: "relative" }}>
            {/* Top Row: Vehicle Number & Date Range Filter */}
            <Flex align="flex-end" gap={8}>
              {/* Vehicle Number Filter Dropdown */}
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <Form.Item label="Vehicle number" style={{ margin: 0 }}>
                  <Button
                    size="large"
                    block
                    onClick={v.toggleHfVehOpen}
                    aria-label="Filter by vehicle number"
                    aria-expanded={v.hfVehOpen}
                    color={v.hfVehOpen || v.hfVehHasSelection ? "primary" : "default"}
                    variant="outlined"
                    icon={<ChevronDown size={18} strokeWidth={2.5} style={{ transform: v.hfVehOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />}
                    iconPlacement="end"
                    className="sv-filter-trigger"
                  >
                    <Text ellipsis>{v.hfVehTriggerLabel}</Text>
                  </Button>
                </Form.Item>

                {v.hfVehOpen && (
                  <Card
                    size="small"
                    role="dialog"
                    aria-label="Vehicle checkbox filter"
                    className="sv-filter-panel"
                    title="Filter by Vehicle"
                    extra={
                      <Flex gap={4} align="center">
                        <Button type="link" size="small" onClick={v.selectAllHfVehicles}>
                          Select All
                        </Button>
                        <Divider orientation="vertical" />
                        <Button type="text" size="small" onClick={v.clearHfVehicles} aria-label="Clear vehicle selection" title="Clear" icon={<Eraser size={16} strokeWidth={2} aria-hidden="true" />} />
                        <Divider orientation="vertical" />
                        <Button type="text" danger size="small" onClick={v.toggleHfVehOpen} aria-label="Close vehicle filter" title="Close" icon={<X size={16} strokeWidth={2.5} aria-hidden="true" />} />
                      </Flex>
                    }
                  >
                    <Flex vertical gap={4} className="sv-check-list">
                      {(v.histVehicles || []).map((veh) => {
                        const isChecked = (v.hfSelectedVehicles || []).includes(veh.id);
                        return (
                          <Checkbox
                            key={veh.id}
                            checked={isChecked}
                            onChange={() => v.toggleHfVehicle(veh.id)}
                            onClick={(e) => e.stopPropagation()}
                            className={isChecked ? "sv-check-row is-on" : "sv-check-row"}
                          >
                            <Flex justify="space-between" align="center" gap={8}>
                              <Text strong>{veh.number}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {veh.count} {veh.count === 1 ? "trip" : "trips"}
                              </Text>
                            </Flex>
                          </Checkbox>
                        );
                      })}
                    </Flex>
                  </Card>
                )}
              </div>

              {/* Date Range Filter Button */}
              <Badge dot={!!v.hfHasRange} offset={[-3, 3]}>
                <Button
                  size="large"
                  onClick={v.toggleHfCal}
                  aria-label="Filter by date range"
                  aria-expanded={v.hfCalOpen}
                  title="Date range"
                  color={v.hfCalOpen || v.hfHasRange ? "primary" : "default"}
                  variant={v.hfHasRange ? "solid" : v.hfCalOpen ? "filled" : "outlined"}
                  icon={<Calendar size={22} strokeWidth={2.2} aria-hidden="true" />}
                  style={{ width: 52 }}
                />
              </Badge>
            </Flex>

            {/* Bottom Row: Client Filter Dropdown */}
            <div style={{ position: "relative" }}>
              <Form.Item label="Client" style={{ margin: 0 }}>
                <Button
                  size="large"
                  block
                  onClick={v.toggleHfClientOpen}
                  aria-label="Filter by client"
                  aria-expanded={v.hfClientOpen}
                  color={v.hfClientOpen || v.hfClientHasSelection ? "primary" : "default"}
                  variant="outlined"
                  icon={<ChevronDown size={18} strokeWidth={2.5} style={{ transform: v.hfClientOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />}
                  iconPlacement="end"
                  className="sv-filter-trigger"
                >
                  <Text ellipsis>{v.hfClientTriggerLabel}</Text>
                </Button>
              </Form.Item>

              {v.hfClientOpen && (
                <Card
                  size="small"
                  role="dialog"
                  aria-label="Client checkbox filter"
                  className="sv-filter-panel"
                  title="Filter by Client"
                  extra={
                    <Flex gap={4} align="center">
                      <Button type="link" size="small" onClick={v.selectAllHfClients}>
                        Select All
                      </Button>
                      <Divider orientation="vertical" />
                      <Button type="text" size="small" onClick={v.clearHfClients} aria-label="Clear client selection" title="Clear" icon={<Eraser size={16} strokeWidth={2} aria-hidden="true" />} />
                      <Divider orientation="vertical" />
                      <Button type="text" danger size="small" onClick={v.toggleHfClientOpen} aria-label="Close client filter" title="Close" icon={<X size={16} strokeWidth={2.5} aria-hidden="true" />} />
                    </Flex>
                  }
                >
                  <Flex vertical gap={4} className="sv-check-list">
                    {(v.histClients || []).map((cli) => {
                      const isChecked = (v.hfSelectedClients || []).includes(cli.id);
                      return (
                        <Checkbox
                          key={cli.id}
                          checked={isChecked}
                          onChange={() => v.toggleHfClient(cli.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={isChecked ? "sv-check-row is-on" : "sv-check-row"}
                        >
                          <Flex justify="space-between" align="center" gap={8}>
                            <Text strong>{cli.name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {cli.count} {cli.count === 1 ? "trip" : "trips"}
                            </Text>
                          </Flex>
                        </Checkbox>
                      );
                    })}
                  </Flex>
                </Card>
              )}
            </div>
            {v.hfCalOpen ? (
              <>
                <Card
                  size="small"
                  role="dialog"
                  aria-label="Closed date range"
                  className="sv-filter-panel"
                  title="Date range"
                  extra={
                    <Button type="text" danger size="small" onClick={v.toggleHfCal} aria-label="Close date range filter" title="Close" icon={<X size={16} strokeWidth={2.5} aria-hidden="true" />} />
                  }
                >
                  <Flex vertical gap={12}>
                    <Flex wrap gap={6}>
                      {(v.hfPresets || []).map((pr, prIdx) => (
                        <React.Fragment key={prIdx}>
                          <Button data-from={pr.from} data-to={pr.to} onClick={v.pickHfPreset} shape="round" type={pr.on ? "primary" : "default"}>
                            {pr.label}
                          </Button>
                        </React.Fragment>
                      ))}
                    </Flex>
                    <Flex gap={10}>
                      <Form.Item label="From date" style={{ flex: 1, minWidth: 0, margin: 0 }}>
                        <DatePicker
                          size="large"
                          inputReadOnly
                          format="DD MMM YYYY"
                          value={toDay(v.hfDraft.from)}
                          onChange={(d) => v.setHfFrom(asDateEvent(d))}
                          maxDate={toDay(v.hfMaxDay) || undefined}
                          status={v.hfErr ? "error" : undefined}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                      <Form.Item label="To date" style={{ flex: 1, minWidth: 0, margin: 0 }}>
                        <DatePicker
                          size="large"
                          inputReadOnly
                          format="DD MMM YYYY"
                          value={toDay(v.hfDraft.to)}
                          onChange={(d) => v.setHfTo(asDateEvent(d))}
                          minDate={toDay(v.hfDraft.from) || undefined}
                          maxDate={toDay(v.hfMaxDay) || undefined}
                          status={v.hfErr ? "error" : undefined}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Flex>
                    {v.hfErr ? (
                      <>
                        <Alert type="error" showIcon title={v.hfErr} />
                      </>
                    ) : null}
                    <Flex gap={8}>
                      <Button type="primary" block onClick={v.applyHfRange}>Apply</Button>
                      <Button type="text" block onClick={v.clearHfRange}>Clear dates</Button>
                    </Flex>
                  </Flex>
                </Card>
              </>
            ) : null}
          </Flex>
        </Form>
        {v.hfHasRange ? (
          <>
            <div>
              <Button shape="round" color="primary" variant="filled" onClick={v.clearHfRange} aria-label="Remove date range" icon={<X size={14} strokeWidth={3} aria-hidden="true" />} iconPlacement="end">
                {v.hfRangeLabel}
              </Button>
            </div>
          </>
        ) : null}
        <Flex justify="space-between" align="baseline" gap={12}>
          <Text type="secondary">{v.histCountLine}</Text>
          {v.hfAnyFilter ? (
            <>
              <Button type="link" onClick={v.clearHfAll} style={{ paddingInline: 0, height: "auto", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
                Clear filters
              </Button>
            </>
          ) : null}
          {v.hfNoFilter ? (
            <>
              <Text type="secondary" style={{ fontSize: 13 }}>Newest first</Text>
            </>
          ) : null}
        </Flex>
        {/* Group trips by Vehicle Number accordion-wise */}
        {(() => {
          const list = v.histList || [];
          if (!list.length) return null;

          const grouped = list.reduce((acc, t) => {
            const vehNo = t.vehicleNumber || (t.crewLine ? t.crewLine.split(' · ')[0] : t.number);
            if (!acc[vehNo]) {
              acc[vehNo] = {
                vehNo,
                edge: t.edge,
                trips: []
              };
            }
            acc[vehNo].trips.push(t);
            return acc;
          }, {});

          const hasClientFilter = (v.hfSelectedClients && v.hfSelectedClients.length > 0) || v.hfClientHasSelection;

          return Object.values(grouped).map((group) => {
            const isExplicitlyToggled = openCards[group.vehNo] !== undefined;
            const isOpen = isExplicitlyToggled
              ? !!openCards[group.vehNo]
              : (v.hfSelectedVehicles && v.hfSelectedVehicles.length === 1) || Object.keys(grouped).length === 1;
            return (
              <Collapse
                key={group.vehNo}
                activeKey={isOpen ? [group.vehNo] : []}
                onChange={() => toggleCard(group.vehNo)}
                expandIconPlacement="end"
                className="sv-hist-group"
                style={{ borderLeftColor: group.edge }}
                items={[
                  {
                    key: group.vehNo,
                    label: <span className="sv-figure" style={{ fontSize: 16 }}>{group.vehNo}</span>,
                    children: (
                      /* Expanded Section: Shows all trip cards for this vehicle as separate cards */
                      <Flex vertical gap={10}>
                        {group.trips.map((t, idx) => {
                          const displayRoute = hasClientFilter
                            ? t.routeLine
                            : (t.routeWithoutClient || (t.routeLine ? t.routeLine.replace(/^.*? → /, '') : ''));

                          return (
                            <Card
                              key={t.id || idx}
                              size="small"
                              hoverable
                              role="button"
                              tabIndex={0}
                              data-id={t.id}
                              onClick={v.openHistTrip}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.openHistTrip(e); } }}
                              title="Click to view trip details"
                              className="sv-edge-card"
                              style={{ borderLeftColor: t.edge }}
                            >
                              <Flex vertical gap={8}>
                                <Flex justify="space-between" align="center" gap={8}>
                                  <Text code strong>{t.number}</Text>
                                  <Tag color={t.badgeColor} className="sv-tag">
                                    {t.badge}
                                  </Tag>
                                </Flex>

                                <Text strong>{t.crewLine}</Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  {displayRoute}
                                </Text>

                                <Flex justify="space-between" gap={12} style={{ paddingTop: 8, borderTop: "1px dashed var(--border-default)" }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>Closed {t.closedAt}</Text>
                                  <Text strong style={{ fontSize: 12 }}>{t.distance}</Text>
                                </Flex>

                                {t.flagged && (
                                  <Text strong style={{ fontSize: 12, color: "var(--st-flagged-fg)" }}>
                                    {t.flagLine}
                                  </Text>
                                )}
                              </Flex>
                            </Card>
                          );
                        })}
                      </Flex>
                    ),
                  },
                ]}
              />
            );
          });
        })()}
        {v.histEmpty ? (
          <>
            <Empty
              style={{ padding: "32px 20px" }}
              image={<Avatar size={56} style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }} icon={<Clock size={26} strokeWidth={2.25} />} />}
              styles={{ image: { height: 56 } }}
              description={
                <>
                  <Text strong style={{ display: "block", fontSize: 20 }}>{v.histEmptyTitle}</Text>
                  <Text type="secondary">{v.histEmptyText}</Text>
                </>
              }
            >
              {v.hfAnyFilter ? (
                <>
                  <Button color="primary" variant="outlined" onClick={v.clearHfAll}>Clear filters</Button>
                </>
              ) : null}
            </Empty>
          </>
        ) : null}
      </Flex>
    </>
  );
};

export default TripHistory;
