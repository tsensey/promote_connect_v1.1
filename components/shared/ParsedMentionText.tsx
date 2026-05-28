'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

interface ParsedMentionTextProps {
  content: string;
  className?: string;
}

interface MentionResolution {
  name: string;
  exposantId: string | null;
}

/**
 * Parse mention text (@CompanyName) and render them as styled links
 * Mentions are displayed with primary color and are clickable to view the profile
 * Fetches exposant IDs from the database to create valid links
 */
export function ParsedMentionText({ 
  content,
  className
}: ParsedMentionTextProps) {
  const [mentionMap, setMentionMap] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(false);

  if (!content) return null;

  // Extract all mention names from content
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /(^|\s)@([A-Za-z0-9\s\-_ÀàÂâÄäÅåÆæÇçÈèÉéÊêËëÌìÍíÎîÏïÐðÒòÓóÔôÖöØøÙùÚúÛûÜüÝýŸÿßœ]+?)(?=\s|$)/g;
    const mentions = new Set<string>();
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[2].trim();
      if (mentionName) mentions.add(mentionName);
    }
    return Array.from(mentions);
  };

  // Fetch exposant IDs for the mentioned names
  useEffect(() => {
    const mentions = extractMentions(content);
    if (mentions.length === 0) {
      setMentionMap(new Map());
      return;
    }

    setLoading(true);
    const fetchMentionIds = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('exposants')
          .select('id, nom')
          .in('nom', mentions);

        if (error || !data) {
          console.error('Error fetching mentions:', error);
          // Create map with null values for failed fetches
          const failedMap = new Map(mentions.map(m => [m, null]));
          setMentionMap(failedMap);
        } else {
          // Create map from results
          const resultMap = new Map<string, string | null>();
          mentions.forEach(mention => {
            const found = data.find(d => d.nom === mention);
            resultMap.set(mention, found?.id || null);
          });
          setMentionMap(resultMap);
        }
      } catch (err) {
        console.error('Error fetching mentions:', err);
        const failedMap = new Map(mentions.map(m => [m, null]));
        setMentionMap(failedMap);
      } finally {
        setLoading(false);
      }
    };

    fetchMentionIds();
  }, [content]);

  // Parse and render mentions
  const renderContent = () => {
    if (loading || mentionMap.size === 0) {
      // Render without links while loading
      return renderWithoutLinks(content);
    }

    const mentionRegex = /(^|\s)(@[A-Za-z0-9\s\-_ÀàÂâÄäÅåÆæÇçÈèÉéÊêËëÌìÍíÎîÏïÐðÒòÓóÔôÖöØøÙùÚúÛûÜüÝýŸÿßœ]+?)(?=\s|$)/g;
    const parts = [];
    let lastIndex = 0;
    let matchIndex = 0;

    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const [fullMatch, prefix, mention] = match;
      const mentionName = mention.slice(1).trim();
      const matchStart = match.index + prefix.length;
      const matchEnd = match.index + fullMatch.length;

      // Add text before mention
      if (matchStart > lastIndex) {
        parts.push(
          <Fragment key={`text-${matchIndex}`}>
            {content.slice(lastIndex, matchStart)}
          </Fragment>
        );
      }

      // Add prefix (space or start)
      if (prefix) {
        parts.push(
          <Fragment key={`prefix-${matchIndex}`}>
            {prefix}
          </Fragment>
        );
      }

      // Get the exposant ID for this mention
      const exposantId = mentionMap.get(mentionName);
      
      if (exposantId) {
        parts.push(
          <Link
            key={`mention-${matchIndex}`}
            href={`/annuaire/${exposantId}`}
            className="font-semibold text-primary hover:underline transition-colors"
          >
            @{mentionName}
          </Link>
        );
      } else {
        // Render as styled text without link
        parts.push(
          <span key={`mention-${matchIndex}`} className="font-semibold text-primary">
            @{mentionName}
          </span>
        );
      }

      lastIndex = matchEnd;
      matchIndex++;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <Fragment key="text-end">
          {content.slice(lastIndex)}
        </Fragment>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  const renderWithoutLinks = (text: string) => {
    const mentionRegex = /(^|\s)(@[A-Za-z0-9\s\-_ÀàÂâÄäÅåÆæÇçÈèÉéÊêËëÌìÍíÎîÏïÐðÒòÓóÔôÖöØøÙùÚúÛûÜüÝýŸÿßœ]+?)(?=\s|$)/g;
    const parts = [];
    let lastIndex = 0;
    let matchIndex = 0;

    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const [fullMatch, prefix, mention] = match;
      const mentionName = mention.slice(1).trim();
      const matchStart = match.index + prefix.length;
      const matchEnd = match.index + fullMatch.length;

      if (matchStart > lastIndex) {
        parts.push(
          <Fragment key={`text-${matchIndex}`}>
            {text.slice(lastIndex, matchStart)}
          </Fragment>
        );
      }

      if (prefix) {
        parts.push(
          <Fragment key={`prefix-${matchIndex}`}>
            {prefix}
          </Fragment>
        );
      }

      parts.push(
        <span key={`mention-${matchIndex}`} className="font-semibold text-primary">
          @{mentionName}
        </span>
      );

      lastIndex = matchEnd;
      matchIndex++;
    }

    if (lastIndex < text.length) {
      parts.push(
        <Fragment key="text-end">
          {text.slice(lastIndex)}
        </Fragment>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  return <span className={className}>{renderContent()}</span>;
}
