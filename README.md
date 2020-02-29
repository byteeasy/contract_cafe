# contract_cafe
A contract cafe




## Dependencies

* [vyper] (https://github.com/vyperlang/vyper.git) - tested with version [v0.1.0-beta.16](https://github.com/vyperlang/vyper/releases/tag/v0.1.0-beta.16)
* [brownie](https://github.com/iamdefinitelyahuman/brownie.git) - tested with version [6.8.2](https://github.com/trufflesuite/ganache-cli/releases/tag/v6.8.2)
* [pip](https://pypi.org/project/pip/)
* [python3](https://www.python.org/downloads/release/python-368/) version 3.6 or greater, I'm using 3.8


As Brownie relies on [`py-solc-x`](https://github.com/iamdefinitelyahuman/py-solc-x), you do not need solc installed locally but you must install all required [solc dependencies](https://solidity.readthedocs.io/en/latest/installing-solidity.html#binary-packages).

## Installation

You can install the latest release via [`pip`](https://pypi.org/project/pip/):

```bash
git clone https://github.com/byteeasy/contract_cafe
cd contract_cafe
pip install vyper
pip install eth-brownie
brownie test
```
