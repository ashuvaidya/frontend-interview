import React from "react";
import styles from "./SingleApplication.module.css";
import { Application } from "../types";

interface SingleApplicationProps {
  application: Application;
}

const SingleApplication = ({ application }: SingleApplicationProps) => {
  const formattedDate = (dateString: string) => {
    const [day, month, year] = new Date(dateString).toLocaleDateString().split("/");
    return `${day}-${month}-${year}`;
  };

  const formattedAmount = '£' + application.loan_amount.toLocaleString('en-GB');
  return (
    <div className={styles.SingleApplication}>
      <div className={styles.cell}>
        <sub>Company</sub>
        {application.company}
      </div>
      <div className={styles.cell}>
        <sub>Name</sub>
        {application.first_name} {application.last_name}
      </div>
      <div className={styles.cell}>
        <sub>Email</sub>
        <span className={styles.email}>{application.email}</span>
      </div>
      <div className={styles.cell}>
        <sub>Loan Amount</sub>
        {formattedAmount}
      </div>
      <div className={styles.cell}>
        <sub>Application Date</sub>
        { formattedDate(application.date_created) }
      </div>
      <div className={styles.cell}>
        <sub>Expiry date</sub>
        {formattedDate(application.expiry_date)}
      </div>
    </div>
  );
};

export default SingleApplication;
