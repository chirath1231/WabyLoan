import Step3Business from './Step3Business.jsx';
import Step3Pension from './Step3Pension.jsx';
import Step3SelfEmployed from './Step3SelfEmployed.jsx';
import Step3Payslip from './Step3Payslip.jsx';

export default function Step3Income(props) {
  const { wizard } = props;
  if (wizard.loanCategory === 'business') return <Step3Business {...props} />;
  if (wizard.loanCategory === 'pension') return <Step3Pension {...props} />;
  if (wizard.sector === 'self_employed') return <Step3SelfEmployed {...props} />;
  return <Step3Payslip {...props} />;
}
