import {
  CHAIN_NAMES,
  useEtherBalance,
  useEthers,
  useNotifications,
} from "@usedapp/core";
import { Button, Layout, Typography, notification } from "antd";
import { formatEther } from "@ethersproject/units";
import { useEffect } from "react";

import { Escrow, Home } from "./pages";
import { Route, Switch } from "react-router";
import { Link } from "react-router-dom";

const { Content } = Layout;

function App() {
  const { chainId, activateBrowserWallet, account } = useEthers();
  const etherBalance = useEtherBalance(account);
  const { notifications } = useNotifications();

  // Notifications.
  useEffect(() => {
    notifications.forEach((n) => {
      if (n.type === "transactionStarted")
        notification["info"]({
          key: n.transaction.hash,
          message: n.transactionName,
          description: "Waiting for transaction to be mined.",
          duration: 0,
        });
      else if (n.type === "transactionSucceed")
        notification["success"]({
          key: n.transaction.hash,
          message: n.transactionName,
          description: `Transaction mined.`,
          duration: 5,
        });
    });
  }, [notifications]);

  if (!account)
    return (
      <Content
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "24px",
        }}
      >
        <Typography.Title>Simple Escrow</Typography.Title>
        <Typography.Paragraph>
          {!!chainId && `Chain: ${CHAIN_NAMES[chainId]}`}
        </Typography.Paragraph>
        <Button type="primary" onClick={() => activateBrowserWallet()}>
          Connect
        </Button>
      </Content>
    );

  return (
    <Content
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "24px",
      }}
    >
      <Link to={`/`}>
        <Typography.Title>Simple Escrow</Typography.Title>
      </Link>
      <Typography.Text type="secondary">
        {account && <>Account: {account}</>}
      </Typography.Text>
      <Typography.Paragraph>
        {etherBalance && <>Balance: {formatEther(etherBalance).slice(0, 5)}</>}
      </Typography.Paragraph>
      <Switch>
        <Route path="/" exact children={<Home />} />
        <Route path="/address/:addr" exact children={<Escrow />} />
      </Switch>
    </Content>
  );
}

export default App;
