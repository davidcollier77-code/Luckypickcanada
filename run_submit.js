const fs = require('fs');
const title = fs.readFileSync('pr_title.txt', 'utf8').trim();
const desc = fs.readFileSync('pr_desc.txt', 'utf8');

console.log(JSON.stringify({
  branch_name: 'jules-turnstile-fixes',
  commit_message: title,
  title: title,
  description: desc
}));
