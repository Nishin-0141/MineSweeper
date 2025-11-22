#!/bin/bash
# AWS CLI のインストールスクリプト
sudo apt update
sudo apt install unzip -y


# AWS CLI をダウンロード
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# 解凍
unzip awscliv2.zip

# インストール
sudo ./aws/install

# インストール確認
aws --version