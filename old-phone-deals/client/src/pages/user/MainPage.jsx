import styles from '../../styles/user/MainPage.module.css';
import React from 'react';
import { Outlet } from 'react-router-dom'; 
import { Layout } from 'antd'; 
import TopBar from '../../components/layout/TopBar';

const { Header, Content } = Layout;

const MainPage = () => {
  return (
    <Layout className={styles.layout}> 
      <Header className={styles.header}> 
        <TopBar />
      </Header>
      <Content className={styles.content}> 
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainPage;