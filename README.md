# Shipbob Weight Audit :balance_scale:

> A tool to keep them "honest". :face_with_symbols_over_mouth:
> I wrote this tool because I experienced (major) discrepancies in my own shipping weights. > For example, items that according to their own system weigh 9oz were shipped as 3lbs, a 5x > markup! :money_with_wings:

I'm making this tool so you can very easily try this on your own using just your PAT (Personal Access Token). Let's unveil the overcharges and save some hard-earned money! :dollar:

I'm making this tool so you can very easily try this on your own using just your PAT (Personal Access Token).

## Getting Started :rocket:

### Clone repository

To clone the repository, use the following commands:

```sh
git clone https://github.com/wkasel/shipbob-weight-audit
cd shipbob-weight-audit
npm install
```

### Obtain Your Personal Access Token (PAT) :key:

1. Login to your Shipbob account.
2. Navigate to Integrations on the left-hand side.
3. Click on API Tokens.
4. Hit the big blue button on top titled Generate New Token.
5. Name your token and hit Save.

### Configure Your Environment :gear:

1. Rename the file .env.example to .env.
2. Open the .env file and replace YOUR_SHIPBOB_PERSONAL_ACCESS_TOKEN with the token you generated in the previous step.

```sh
SHIPBOB_API_SECRET=YOUR_SHIPBOB_PERSONAL_ACCESS_TOKEN
```

### Run the Audit :mag:

Now that everything is set up, it's time to run the audit and discover any overcharges.

```sh
npm run audit

```

This will execute the audit script, and you'll see a summary of the results in the console. Look out for the Overcharged Weight and Overcharged Percentage to see how much you've been overcharged.

### Results :chart_with_upwards_trend:

Here's an example of the results you might see:

```sh
2023-09-27T03:06:27.601Z info: Total Orders: 193
2023-09-27T03:06:27.601Z info: Orders with Charged Weight: 165
2023-09-27T03:06:27.602Z info: Orders with Null Charged Weight: 28
2023-09-27T03:06:27.602Z info: Total Actual Weight: 636.6600000000001
2023-09-27T03:06:27.602Z info: Total Charged Weight: 1137
2023-09-27T03:06:27.602Z info: Overcharged Weight: 500.3399999999999
2023-09-27T03:06:27.602Z info: Overcharged Percentage: 44.01%
```

Feel the rage? :rage: Now, share this tool with others and let's hold them accountable!

### Contributing :handshake:

Feel free to fork this repository, make improvements, and create a pull request. Together, we can make a difference and stop the overcharging madness! :fist:

### License :scroll:

This project is licensed under the MIT License. See the LICENSE file for details.

Happy auditing and good luck reclaiming your money! :moneybag:
