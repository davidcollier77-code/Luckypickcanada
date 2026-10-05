const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/homepage/HomePage.js');
let content = fs.readFileSync(filePath, 'utf8');

// I inserted the following block, let's fix it
// `      {paymentError && (\n        <p className="suggestion-box-notice suggestion-box-notice-error" role="alert" style={{ marginBottom: '1rem' }}>\n          {paymentError}\n        </p>\n      )}\n      <section className="homepage-section homepage-community-grid " aria-label="Lucky Pick Canada community">`

const badStr1 = "const [suggestionError, setSuggestionError] = useState('');\\n  const [paymentError, setPaymentError] = useState('');";
if (content.includes(badStr1)) {
  content = content.replace(badStr1, "const [suggestionError, setSuggestionError] = useState('');\n  const [paymentError, setPaymentError] = useState('');");
}

const badStr2 = "{paymentError && (\\n        <p className=\"suggestion-box-notice suggestion-box-notice-error\" role=\"alert\" style={{ marginBottom: '1rem' }}>\\n          {paymentError}\\n        </p>\\n      )}\\n      <section className=\"homepage-section homepage-community-grid \" aria-label=\"Lucky Pick Canada community\">";
if (content.includes(badStr2)) {
  content = content.replace(badStr2, `{paymentError && (
        <p className="suggestion-box-notice suggestion-box-notice-error" role="alert" style={{ marginBottom: '1rem' }}>
          {paymentError}
        </p>
      )}
      <section className="homepage-section homepage-community-grid " aria-label="Lucky Pick Canada community">`);
}

fs.writeFileSync(filePath, content);
