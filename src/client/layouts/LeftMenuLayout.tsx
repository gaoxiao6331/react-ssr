import React, { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Routes, Route, useLocation, Outlet, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { useRedux } from '@/hooks/useRedux';
import PageLoading from '@/components/PageLoading';
import { RouteElement } from '@client/components/RouterV6';
import { thyCookie, thyEnv } from '@thyiad/util';
import { getMatchRoute } from '@/utils/index';
import { LOGIN_COOKIE_KEY } from '@client/constants/index';
import { LOGIN_PATHNAME } from '@client/constants/url';
import systemInfo from '@client/constants/systemInfo';
import { fetchCurrentUser } from '@/models/User';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import AvatarDropdown from './AvatarDropdown';
import CommonFooter from './CommonFooter';
import { useRole } from '@/hooks/useRole';

const { Header, Sider, Content } = Layout;

import './LeftMenuLayout.scss';
import logo from '@/assets/img/logo.png';
import { renderRoute } from '@client/utils/ui';

/**
 * 左侧菜单layout
 * @param props
 */
const LeftMenuLayout: FC<RoutePageProps> = (props) => {
    const { routes } = props;
    const { state, actions } = useRedux();

    const navigate = useNavigate();
    const location = useLocation();
    const { isFirstRender, checkRole } = useRole(navigate, location, state.currentUser?.role);

    const [collapsed, setCollapsed] = useState(false);

    const initActiveMenu: string = useMemo(() => {
        if (!thyEnv.canUseWindow()) {
            return '';
        }
        const findedRoute = getMatchRoute();
        if (findedRoute) {
            return findedRoute.redirect || findedRoute.path;
        }
        return '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const accessKey = thyCookie.get(LOGIN_COOKIE_KEY);
        if (!accessKey) {
            window.location.href = `${LOGIN_PATHNAME}?target=${encodeURIComponent(window.location.href)}`;
            return;
        }
        fetchCurrentUser().then((res) => {
            actions.user.setcurrentUser(res);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderMenu = useCallback(
        (item: RouteProps, parentPathList: string[]) => {
            if (item.hideInMenu || (item.roles && !item.roles.includes(state.currentUser?.role))) {
                return null;
            }
            return Array.isArray(item.routes) && item.routes.length > 0 ? (
                <Menu.SubMenu key={item.path} icon={item.icon} title={item.title}>
                    {item.routes.map((child) => {
                        return renderMenu(child, [...parentPathList, item.relativePath || item.path]);
                    })}
                </Menu.SubMenu>
            ) : (
                <Menu.Item key={item.path} icon={item.icon}>
                    <Link to={[...parentPathList, item.relativePath || item.path].join('/')}>{item.title}</Link>
                </Menu.Item>
            );
        },
        [state.currentUser],
    );

    return useMemo(() => {
        // 如果用户信息为空，显示loading
        if (!state.currentUser) {
            return <PageLoading />;
        }

        if (isFirstRender.current) {
            checkRole(navigate, window.location.pathname, state.currentUser?.role);
            isFirstRender.current = false;
        }

        return (
            <Layout className="left-menu-layout">
                <Sider trigger={null} collapsible collapsed={collapsed} width={150}>
                    <div className="sider-logo">
                        <a href="/">
                            <img src={logo} alt="" />
                        </a>
                    </div>
                    <Menu theme="dark" mode="inline" defaultSelectedKeys={[initActiveMenu]}>
                        {routes.map((item) => {
                            return renderMenu(item, []);
                        })}
                    </Menu>
                </Sider>
                <Layout className="site-layout">
                    <Header className="site-layout-header">
                        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger',
                            onClick: () => {
                                setCollapsed(!collapsed);
                            },
                        })}
                        <div className="content">
                            <span className="title">{systemInfo.titleDesc}</span>
                        </div>
                        <AvatarDropdown />
                    </Header>
                    <Content className="site-layout-content">
                        <div className="site-layout-content-wrapper">
                            <Outlet />
                        </div>
                        <CommonFooter />
                    </Content>
                </Layout>
            </Layout>
        );
    }, [state.currentUser, isFirstRender, collapsed, initActiveMenu, routes, checkRole, renderMenu, navigate]);
};

export default LeftMenuLayout;
