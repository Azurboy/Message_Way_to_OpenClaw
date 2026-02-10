"""Parse OPML files to extract feed list."""

import xml.etree.ElementTree as ET
from pathlib import Path


def parse_opml(file_path: str | Path) -> list[dict]:
    """Parse an OPML file and return a list of feed dicts."""
    tree = ET.parse(file_path)
    root = tree.getroot()
    body = root.find("body")
    if body is None:
        return []

    feeds = []
    _walk_outlines(body, "", feeds)
    return feeds


def _walk_outlines(element: ET.Element, category: str, feeds: list[dict]):
    for outline in element.findall("outline"):
        xml_url = outline.get("xmlUrl", "")
        if xml_url:
            feeds.append({
                "title": outline.get("text", "") or outline.get("title", ""),
                "xml_url": xml_url,
                "html_url": outline.get("htmlUrl", ""),
                "category": category,
            })
        else:
            sub_category = outline.get("text", "") or outline.get("title", "")
            if category:
                sub_category = f"{category} / {sub_category}"
            _walk_outlines(outline, sub_category, feeds)
