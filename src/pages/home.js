import { useEthers, useSendTransaction, useTransactions } from "@usedapp/core";
import { Button, Input, Typography, Form, List } from "antd";
import { ethers, utils } from "ethers";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import abi from "../assets/escrow/abi.json";
import bytecode from "../assets/escrow/bytecode.json";

const agreement = "";

function Home() {
  const { account, library } = useEthers();
  const { transactions } = useTransactions();
  const { sendTransaction } = useSendTransaction({
    transactionName: "Create Escrow",
  });

  const factory = useMemo(() => {
    if (!account) return;
    const signer = library.getSigner();

    return new ethers.ContractFactory(abi, bytecode, signer);
  }, [account, library]);

  const deploy = ({ payee, arbitrator, amount }) => {
    const deployTx = factory.getDeployTransaction(payee, arbitrator, agreement);
    sendTransaction({ ...deployTx, value: utils.parseEther(amount) });
  };

  return (
    <>
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

        <Form.Item
          label="Value"
          name="amount"
          rules={[
            {
              required: true,
              message: "Enter the amount (in ETH) to be paid.",
            },
          ]}
        >
          <Input placeholder="0.01 ETH" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" disabled={!account}>
            Deploy
          </Button>
        </Form.Item>
      </Form>

      <List
        bordered
        dataSource={transactions.filter(
          (t) => t.receipt && t.receipt.contractAddress
        )}
        renderItem={(transaction) => (
          <List.Item>
            <Typography.Link>
              <Link to={`address/${transaction.receipt.contractAddress}`}>
                {transaction.receipt.contractAddress}
              </Link>
            </Typography.Link>
          </List.Item>
        )}
      />
    </>
  );
}

export default Home;
