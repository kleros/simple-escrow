import {
  CHAIN_NAMES,
  useEtherBalance,
  useEthers,
  useNotifications,
  useSendTransaction,
  useTransactions,
} from "@usedapp/core";
import {
  Button,
  Input,
  Layout,
  Typography,
  Form,
  notification,
  List,
} from "antd";
import { formatEther } from "@ethersproject/units";
import { ethers } from "ethers";

import abi from "./assets/abi.json";
import bytecode from "./assets/bytecode.json";
import { useEffect, useMemo } from "react";

const { Content } = Layout;

const agreement = "";

function App() {
  const { chainId, activateBrowserWallet, account, library } = useEthers();
  const etherBalance = useEtherBalance(account);
  const { notifications } = useNotifications();
  const { transactions } = useTransactions();
  const { sendTransaction } = useSendTransaction({
    transactionName: "Create Escrow",
  });

  const factory = useMemo(() => {
    if (!account) return;
    const signer = library.getSigner();

    return new ethers.ContractFactory(abi, bytecode, signer);
  }, [account, library]);

  const deploy = ({ payee, arbitrator }) => {
    const deployTx = factory.getDeployTransaction(payee, arbitrator, agreement);
    sendTransaction(deployTx);
  };

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
          description: `Transaction mined. Contract at ${n.transaction.creates}`,
          duration: 0,
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
      <Typography.Title>Simple Escrow</Typography.Title>
      <Typography.Text type="secondary">
        {account && <>Account: {account}</>}
      </Typography.Text>
      <Typography.Paragraph>
        {etherBalance && <>Balance: {formatEther(etherBalance).slice(0, 5)}</>}
      </Typography.Paragraph>
      <Form
        name="create"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        onFinish={deploy}
      >
        <Form.Item
          label="Payee"
          name="payee"
          rules={[
            {
              required: true,
              message: "Enter the address that should receive the funds.",
            },
          ]}
        >
          <Input placeholder="0xdeadbeeef..." />
        </Form.Item>

        <Form.Item
          label="Arbitrator"
          name="arbitrator"
          rules={[
            {
              required: true,
              message: "Enter the address of the arbitrator.",
            },
          ]}
        >
          <Input placeholder="0xc01dc0ffee..." />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" disabled={!account}>
            Deploy
          </Button>
        </Form.Item>
      </Form>

      <List
        bordered
        dataSource={transactions}
        renderItem={(transaction) => (
          <List.Item>
            <a
              href={`https://kovan.etherscan.io/address/${transaction.receipt.contractAddress}`}
            >
              {transaction.receipt.contractAddress}
            </a>
          </List.Item>
        )}
      />
    </Content>
  );
}

export default App;
