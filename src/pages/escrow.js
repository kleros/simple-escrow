import {
  useBlockMeta,
  useContractCalls,
  useContractFunction,
  useEthers,
} from "@usedapp/core";
import { Button, Space } from "antd";
import { useParams } from "react-router";
import { utils, Contract } from "ethers";
import humanizeDuration from "humanize-duration";
import { useCallback, useEffect, useMemo, useState } from "react";

import escrowAbi from "../assets/escrow/abi.json";
import arbitratorAbi from "../assets/arbitrator/abi.json";

const statusCodeToName = ["Initial", "Reclaimed", "Disputed", "Resolved"];
const statusNameToCode = {
  Initial: 0,
  Reclaimed: 1,
  Disputed: 2,
  Resolved: 3,
};

function Escrow() {
  const escrowInterface = new utils.Interface(escrowAbi);
  const { account, library } = useEthers();
  const { timestamp: dateTimestamp } = useBlockMeta();
  const { addr: address } = useParams();
  const [
    statusArr,
    payerArr,
    reclaimedAtArr,
    arbitrationFeeDepositPeriodArr,
    reclamationPeriodArr,
    createdAtArr,
    arbitratorAddrArr,
  ] = useContractCalls([
    {
      abi: escrowInterface,
      address,
      method: "status",
      args: [],
    },
    {
      abi: escrowInterface,
      address,
      method: "payer",
      args: [],
    },
    {
      abi: escrowInterface,
      address,
      method: "reclaimedAt",
      args: [],
    },
    {
      abi: escrowInterface,
      address,
      method: "arbitrationFeeDepositPeriod",
      args: [],
    },
    {
      abi: escrowInterface,
      address,
      method: "reclamationPeriod",
      args: [],
    },
    {
      abi: escrowInterface,
      address,
      method: "createdAt",
      args: [],
    },
    {
      abi: escrowInterface,
      address,
      method: "arbitrator",
      args: [],
    },
  ]);

  const escrow = useMemo(() => {
    if (!account) return;
    return new Contract(address, escrowAbi, library.getSigner());
  }, [account, address, library]);
  const { send: releaseFunds } = useContractFunction(escrow, "releaseFunds", {
    transactionName: "Release Funds",
  });
  const { send: reclaimFunds } = useContractFunction(escrow, "reclaimFunds", {
    transactionName: "Reclaim Funds",
  });
  const { send: raiseDispute } = useContractFunction(
    escrow,
    "depositArbitrationFeeForPayee",
    { transactionName: "Raise Dispute" }
  );

  // useDapp returns arrays instead of the actual values for whatever reason.
  // See https://github.com/EthWorks/useDApp/issues/380.
  const status = statusArr && statusArr[0];
  const payer = payerArr && payerArr[0];

  // It is safe to cast these values to number because they can fit inside
  // javascript's Number type. You should be careful when dealing with larger
  // values though (such as tokens or ether).
  const reclamationPeriod =
    reclamationPeriodArr && Number(reclamationPeriodArr[0]);
  const createdAt = createdAtArr && Number(createdAtArr[0]);
  const reclaimedAt = reclaimedAtArr && Number(reclaimedAtArr[0]);
  const arbitrationFeeDepositPeriod =
    arbitrationFeeDepositPeriodArr && Number(arbitrationFeeDepositPeriodArr[0]);
  const arbitratorAddr = arbitratorAddrArr && arbitratorAddrArr[0];

  const timestamp = dateTimestamp && Math.round(dateTimestamp.getTime() / 1000);

  const [arbitrationCost, setArbitrationCost] = useState();
  useEffect(() => {
    if (!arbitratorAddr) return;
    (async () => {
      setArbitrationCost(
        await new Contract(
          arbitratorAddr,
          arbitratorAbi,
          library
        ).arbitrationCost("0x00")
      );
    })();
  }, [arbitratorAddr, library]);

  const canReclaim = useMemo(() => {
    if (
      typeof status === "undefined" ||
      typeof timestamp === "undefined" ||
      typeof payer === "undefined" ||
      typeof account === "undefined" ||
      typeof reclaimedAt === "undefined" ||
      typeof arbitrationFeeDepositPeriod === "undefined"
    ) {
      return;
    }

    if (
      status !== statusNameToCode.Initial &&
      status !== statusNameToCode.Reclaimed
    ) {
      return false;
    }

    if (payer !== account) {
      return false;
    }

    if (status === statusNameToCode.Reclaimed) {
      if (timestamp - reclaimedAt <= arbitrationFeeDepositPeriod) return false;

      return true;
    }

    if (timestamp - createdAt > reclamationPeriod) {
      return false;
    }

    return true;
  }, [
    account,
    arbitrationFeeDepositPeriod,
    createdAt,
    payer,
    reclaimedAt,
    reclamationPeriod,
    status,
    timestamp,
  ]);

  const canRelease = useMemo(() => {
    if (
      typeof status === "undefined" ||
      typeof account === "undefined" ||
      typeof payer === "undefined" ||
      typeof timestamp === "undefined" ||
      typeof createdAt === "undefined" ||
      typeof reclamationPeriod === "undefined"
    ) {
      return;
    }

    if (status !== statusNameToCode.Initial) return false;

    if (account !== payer && timestamp - createdAt <= reclamationPeriod)
      return false;

    return true;
  }, [account, createdAt, payer, reclamationPeriod, status, timestamp]);

  const canRaiseDispute = useMemo(() => {
    if (typeof status === "undefined") return;
    return status === statusCodeToName.Reclaimed;
  }, [status]);

  const remainingTimeToReclaim = useMemo(() => {
    if (typeof status === "undefined") return;
    if (status !== statusNameToCode.Initial) return;

    return timestamp - createdAt > reclamationPeriod
      ? 0
      : createdAt + reclamationPeriod - timestamp;
  }, [createdAt, reclamationPeriod, status, timestamp]);

  const remainingTimeToDepositArbitrationFee = useMemo(() => {
    if (typeof status === "undefined") return;
    if (status !== statusNameToCode.Reclaimed) return;

    return timestamp - reclaimedAt > arbitrationFeeDepositPeriod
      ? 0
      : reclaimedAt + arbitrationFeeDepositPeriod - timestamp;
  }, [arbitrationFeeDepositPeriod, reclaimedAt, status, timestamp]);

  const release = useCallback(() => releaseFunds(), [releaseFunds]);
  const reclaim = useCallback(() => {
    if (status === statusNameToCode.Reclaimed) reclaimFunds();
    else reclaimFunds({ value: arbitrationCost });
  }, [arbitrationCost, reclaimFunds, status]);
  const createDispute = useCallback(() => {
    raiseDispute({ value: arbitrationCost });
  }, [arbitrationCost, raiseDispute]);

  return (
    <Space direction="vertical" align="center">
      <Space>Status: {statusCodeToName[status]}</Space>
      {typeof remainingTimeToReclaim !== "undefined" &&
        remainingTimeToReclaim > 0 &&
        canReclaim && (
          <Space>
            {" "}
            Reclaim deadline: {humanizeDuration(
              remainingTimeToReclaim * 1000
            )}{" "}
          </Space>
        )}
      {typeof remainingTimeToDepositArbitrationFee !== "undefined" &&
        remainingTimeToDepositArbitrationFee > 0 && (
          <Space>
            {" "}
            Dispute Deadline:{" "}
            {humanizeDuration(remainingTimeToDepositArbitrationFee * 1000)}
          </Space>
        )}
      {canRelease && <Button onClick={release}>Release Funds</Button>}
      {canReclaim && <Button onClick={reclaim}>Reclaim Funds</Button>}
      {canRaiseDispute && (
        <Button onClick={createDispute}>Raise Dispute</Button>
      )}
    </Space>
  );
}

export default Escrow;
