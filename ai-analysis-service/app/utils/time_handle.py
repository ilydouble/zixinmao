def parse_report_date(date_str: str):
    """
    灵活解析报告日期，支持多种格式

    Args:
        date_str: 日期字符串

    Returns:
        datetime对象
    """
    from datetime import datetime

    # 尝试多种日期格式
    formats = [
        "%Y-%m-%d %H:%M:%S",  # 2024-10-15 12:00:00
        "%Y-%m-%d",           # 2024-10-15
        "%Y/%m/%d %H:%M:%S",  # 2024/10/15 12:00:00
        "%Y/%m/%d",           # 2024/10/15
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    # 如果所有格式都失败，抛出异常
    raise ValueError(f"无法解析日期格式: {date_str}")