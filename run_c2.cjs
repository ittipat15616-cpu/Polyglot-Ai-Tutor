const { execSync } = require('child_process');
for (let i = 0; i < 7; i++) {
   console.log('Run ' + (i+1));
   try {
       execSync('npx -y tsx gen_c2_examples.cjs', {stdio: 'inherit'});
   } catch(e) {}
}
