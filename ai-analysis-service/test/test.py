import requests
import json
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import os

# AES CBC 加密函数，返回 Base64
def aes_encrypt(plaintext, key):
    # 将16进制密钥转换为字节
    key_bytes = bytes.fromhex(key)
    # 生成随机IV
    iv = os.urandom(16)
    # 创建加密器
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
    # 对明文进行填充并加密
    padded_data = pad(plaintext.encode('utf-8'), AES.block_size)
    encrypted_data = cipher.encrypt(padded_data)
    # 连接IV和加密后的数据
    result = iv + encrypted_data
    # 转换为Base64编码
    return base64.b64encode(result).decode('utf-8')

# AES CBC 解密函数，返回解密后的明文
def aes_decrypt(encrypted_text, key):
    # 将Base64编码的加密数据转换为字节
    encrypted_bytes = base64.b64decode(encrypted_text)
    # 将16进制密钥转换为字节
    key_bytes = bytes.fromhex(key)
    # 从加密数据中提取IV和加密数据
    iv = encrypted_bytes[:16]
    encrypted_data = encrypted_bytes[16:]
    # 创建解密器
    decipher = AES.new(key_bytes, AES.MODE_CBC, iv)
    # 解密并去除填充
    padded_data = decipher.decrypt(encrypted_data)
    return unpad(padded_data, AES.block_size).decode('utf-8')

def CallApi(name,id_card,mobile_no,auth_date):
    # API相关配置
    interface_name = "COMBHZY2"  #接口编号
    access_id = "26999e385f2e4075"
    key = "230ec95c25dae2279f1b8caf0ef8ae1b"
    url = f"https://api.tianyuanapi.com/api/v1/{interface_name}"
    
    # 构建请求参数
    params = {
        "mobile_no": mobile_no,
        "id_card": id_card,
        "auth_date": auth_date,
        "name": name,
    }
    
    # 将参数转换为JSON字符串并加密
    json_str = json.dumps(params)
    print(f"请求参数: {json_str}")
    encrypted_data = aes_encrypt(json_str, key)
    print(f"加密后的数据: {encrypted_data}")
    
    # 发送请求
    headers = {
        "Access-Id": access_id,
        "Content-Type": "application/json"
    }
    
    payload = {
        "data": encrypted_data
    }
    
    print(f"发送请求到: {url}")
    try:
        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json()
        print(f"API响应: {response_data}")
        
        # 处理响应
        code = response_data.get("code")
        message = response_data.get("message")
        encrypted_response_data = response_data.get("data")
        
        result = {
            "code": code,
            "success": code == 0,
            "message": message,
            "encrypted_response": encrypted_response_data
        }
        
        # 如果有返回data，尝试解密
        if encrypted_response_data:
            try:
                decrypted_data = aes_decrypt(encrypted_response_data, key)
                result["decrypted_response"] = json.loads(decrypted_data)
            except Exception as e:
                print(f"解密响应数据失败: {e}")
                result["decrypted_response"] = None
        
        return result
    except Exception as e:
        print(f"请求失败: {e}")
        return {"success": False, "message": f"请求失败: {e}"}

def main():
    print("=====  个人涉诉详版 =====")
    
    # 直接设置手机号和姓名
    name = "东贵廷"
    id_card = "130525199012045113"
    mobile_no = "15011534946"
    auth_date = "20250318-20270318"
    
    result = CallApi(name,id_card,mobile_no,auth_date)
    
    print("\n===== 结果 =====")
    if result["success"]:
        print("请求成功!")
        if result.get("decrypted_response"):
            print(f"解密后的响应: {json.dumps(result['decrypted_response'], ensure_ascii=False, indent=2)}")
        else:
            print("未能获取或解密响应数据")
    else:
        print(f"请求失败: {result.get('message', '未知错误')}")

if __name__ == "__main__":
    main() 