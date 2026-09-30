import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Card, Drawer, Empty, Flex, Layout, Typography } from 'antd';
import { CalendarDays } from 'lucide-react';
import { useTMSAdmin, TMSAdminProvider } from '../../context/TMSAdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDrawer from './AdminDrawer';
import { AdminConfirmDialog, AdminToast } from './AdminConfirmDialog';
import { getPageMeta } from './pageMeta';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { moduleForPath } from '../../utils/moduleAccess';
import '../../styles/adminLayout.css';
import { matchesSearch } from '../../utils/search';

const AdminLayoutContent = () => {
  const {
    navOpen,
    setNavOpen,
    globalQ,
    setGlobalQ,
    T,
    navTo,
    width,
  } = useTMSAdmin();

  const location = useLocation();
  const { can, firstPath } = useModuleAccess();
  const pageModule = moduleForPath(location.pathname);
  const blocked = pageModule && !can(pageModule);
  const meta = getPageMeta(location.pathname);
  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dayLabel = now.toLocaleDateString('en-IN', { weekday: 'long' });

  const narrow = width < 900;
  const tms = T();
  const gq = globalQ.trim().toLowerCase();
  const searching = gq.length > 1;

  const trips = tms.trips || [];
  const vehicles = tms.vehicles || [];
  const drivers = tms.drivers || [];
  const clients = tms.clients || [];

  const searchResults = searching
    ? [
        ...trips
          .filter(t => matchesSearch(gq, t.number, (tms.V[t.vehicle] || {}).number, (tms.D[t.driver] || {}).name))
          .map(t => ({
            kind: 'Trip',
            title: t.number,
            sub: `${(tms.V[t.vehicle] || {}).number || ''} · ${(tms.D[t.driver] || {}).name || ''} · ${t.status}`,
            route: 'trip',
            id: t.id,
          })),
        ...vehicles
          .filter(v => matchesSearch(gq, v.number))
          .map(v => ({
            kind: 'Vehicle',
            title: v.number,
            sub: `${v.type} · ${(tms.B[v.branch] || {}).name || ''}`,
            route: 'vehicles',
            id: v.id,
          })),
        ...drivers
          .filter(d => matchesSearch(gq, d.name))
          .map(d => ({
            kind: 'Driver',
            title: d.name,
            sub: `${(tms.B[d.branch] || {}).name || ''} · ${d.type}`,
            route: 'drivers',
            id: d.id,
          })),
        ...clients
          .filter(c => matchesSearch(gq, c.name))
          .map(c => ({
            kind: 'Client',
            title: c.name,
            sub: `${c.customers} customers`,
            route: 'clients',
            id: c.id,
          })),
      ]
    : [];

  const sidebar = <AdminSidebar onClose={() => setNavOpen(false)} />;

  return (
    <Layout className="tms-shell">
      <AdminHeader onOpenNav={() => setNavOpen(true)} narrow={narrow} />

      <Layout hasSider className="tms-body">
        {/* Desktop: fixed sidebar column. Phones/tablets: slide-in drawer. */}
        {narrow ? (
          <Drawer
            placement="left"
            open={navOpen}
            onClose={() => setNavOpen(false)}
            closable={false}
            size={246}
            rootClassName="tms-sidebar-drawer"
            styles={{ body: { padding: 0 }, mask: { background: 'rgba(20,32,43,.45)' } }}
          >
            {sidebar}
          </Drawer>
        ) : (
          <Layout.Sider width={246} className="tms-sider">
            {sidebar}
          </Layout.Sider>
        )}

        {/* Main Column */}
        <Layout.Content style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Global Search Overlay */}
          {searching ? (
            <Flex vertical gap={12} style={{ padding: 24 }}>
              <Flex justify="space-between" align="center">
                <Typography.Text type="secondary">
                  {searchResults.length} results for &ldquo;{globalQ}&rdquo;
                </Typography.Text>
                <Button type="link" onClick={() => setGlobalQ('')}>Close search</Button>
              </Flex>
              {searchResults.map((r, i) => (
                <Card
                  key={i}
                  size="small"
                  hoverable
                  role="button"
                  tabIndex={0}
                  onClick={() => navTo(r.route, { selectedTrip: r.id })}
                  onKeyDown={(e) => { if (e.key === 'Enter') navTo(r.route, { selectedTrip: r.id }); }}
                >
                  <Flex gap={16} align="center" wrap>
                    <span className="tms-kicker" style={{ width: 80, margin: 0, color: 'var(--text-muted)' }}>{r.kind}</span>
                    <Typography.Text strong>{r.title}</Typography.Text>
                    <Typography.Text type="secondary">{r.sub}</Typography.Text>
                  </Flex>
                </Card>
              ))}
              {searchResults.length === 0 && (
                <Card>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <>
                        <Typography.Title level={5} style={{ margin: 0 }}>Nothing matches</Typography.Title>
                        <Typography.Text type="secondary">Search by trip number, vehicle registration, driver or client name.</Typography.Text>
                      </>
                    }
                  />
                </Card>
              )}
            </Flex>
          ) : (
            <Flex
              vertical
              gap={20}
              key={location.pathname}
              className="tms-page-enter"
              style={{ padding: narrow ? '16px' : '20px 28px 28px', flex: 1, boxSizing: 'border-box' }}
            >
              {/* Pages listed in OWN_HEAD render their own heading, so this one is skipped */}
              {!meta.hideHead && (
                <div className="tms-pagehead">
                  <div style={{ minWidth: 0 }}>
                    <h1>{meta.title}</h1>
                    {meta.sub && <p>{meta.sub}</p>}
                  </div>
                  <div className="tms-pagehead-date">
                    <CalendarDays size={20} color="var(--kr-grey-700)" />
                    <span>
                      <strong>Today, {todayLabel}</strong>
                      <small>{dayLabel}</small>
                    </span>
                  </div>
                </div>
              )}
              {!blocked ? (
                <Outlet />
              ) : firstPath ? (
                <Navigate to={firstPath} replace />
              ) : (
                <Card>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <>
                        <Typography.Title level={5} style={{ margin: 0 }}>No modules assigned</Typography.Title>
                        <Typography.Text type="secondary">Your account has no module access yet. Ask an administrator to grant access in Users &amp; roles.</Typography.Text>
                      </>
                    }
                  />
                </Card>
              )}
            </Flex>
          )}
        </Layout.Content>
      </Layout>

      {/* Global Slide-In Drawer */}
      <AdminDrawer />

      {/* Global Confirmation Dialog */}
      <AdminConfirmDialog />

      {/* Global Toast Alert */}
      <AdminToast />
    </Layout>
  );
};

export const AdminLayout = () => {
  return (
    <TMSAdminProvider>
      <AdminLayoutContent />
    </TMSAdminProvider>
  );
};

export default AdminLayout;
