import { CHAIN_NAMES, useEtherBalance, useEthers } from "@usedapp/core";
import { Button, Input, Layout, Typography, Form } from "antd";
import { formatEther } from "@ethersproject/units";

const { Content } = Layout;

function App() {
  const { chainId, activateBrowserWallet, account } = useEthers();
  const etherBalance = useEtherBalance(account);

  const onFinish = (values) => {
    console.log("Success:", values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

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
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
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
          <Button type="primary" htmlType="submit">
            Deploy
          </Button>
        </Form.Item>
      </Form>
    </Content>
  );
}

export default App;
