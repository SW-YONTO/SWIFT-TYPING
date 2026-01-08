import React, { useState, useEffect, useRef, useMemo } from "react";

/**
 * SwiftTypeDisplay - Word-based text display with line jumping
 * Extracted from MonkeyTypeText for better modularity
 */
const SwiftTypeDisplay = React.memo(
  ({ content, currentIndex, errors, theme, fontSize, fontFamily }) => {
    const containerRef = useRef(null);
    const wordsRef = useRef(null);
    const [translateY, setTranslateY] = useState(0);
    const [visibleStartIndex, setVisibleStartIndex] = useState(0);
    const lastLineTopRef = useRef(0);
    const lineHeightRef = useRef(0);

    // Font size mapping for typing area
    const getTypingFontSize = () => {
      const fontSizeMap = {
        small: "text-lg",
        medium: "text-xl",
        large: "text-2xl",
        xl: "text-3xl",
        "2xl": "text-4xl",
      };
      return fontSizeMap[fontSize] || fontSizeMap["medium"];
    };

    // Font family mapping with offline fallbacks
    const getTypingFontFamily = () => {
      const fontFamilyMap = {
        inter:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        roboto:
          'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      };
      return fontFamilyMap[fontFamily] || fontFamilyMap["mono"];
    };

    // Split content into words with position tracking
    const allWords = useMemo(() => {
      const result = [];
      let currentWord = "";
      let startIndex = 0;

      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === " " || char === "\n" || char === "\t") {
          if (currentWord) {
            result.push({
              text: currentWord,
              startIndex,
              endIndex: i - 1,
              isWord: true,
            });
          }
          currentWord = "";
          startIndex = i + 1;
        } else {
          currentWord += char;
        }
      }
      if (currentWord) {
        result.push({
          text: currentWord,
          startIndex,
          endIndex: content.length - 1,
          isWord: true,
        });
      }
      return result;
    }, [content]);

    // Find current word index
    const currentWordIndex = useMemo(() => {
      for (let i = 0; i < allWords.length; i++) {
        if (
          currentIndex >= allWords[i].startIndex &&
          currentIndex <= allWords[i].endIndex + 1
        ) {
          return i;
        }
      }
      return allWords.length - 1;
    }, [allWords, currentIndex]);

    // Filter visible words - show current word and upcoming words only
    const visibleWords = useMemo(() => {
      // Show from visibleStartIndex onwards (max ~40 words for 2-3 lines)
      return allWords.slice(visibleStartIndex, visibleStartIndex + 40);
    }, [allWords, visibleStartIndex]);

    // Line jumping effect - 3-line system, user types on middle line
    useEffect(() => {
      if (
        !wordsRef.current ||
        currentWordIndex < 0 ||
        visibleWords.length === 0
      )
        return;

      const wordElements = Array.from(
        wordsRef.current.querySelectorAll(".word")
      );
      if (wordElements.length === 0) return;

      const currentVisibleIndex = currentWordIndex - visibleStartIndex;
      if (currentVisibleIndex < 0 || currentVisibleIndex >= wordElements.length)
        return;

      const currentWordEl = wordElements[currentVisibleIndex];
      if (!currentWordEl) return;

      const currentTop = currentWordEl.offsetTop;

      // Initialize on first render
      if (lineHeightRef.current === 0 && wordElements[0]) {
        const firstWordHeight = wordElements[0].offsetHeight;
        const computedStyle = window.getComputedStyle(wordElements[0]);
        const lineHeight =
          parseFloat(computedStyle.lineHeight) || firstWordHeight * 1.6;
        lineHeightRef.current = lineHeight;
        lastLineTopRef.current = 0;
        return;
      }

      // Detect line change with threshold
      const lineChangeThreshold = lineHeightRef.current * 0.5;

      if (currentTop > lastLineTopRef.current + lineChangeThreshold) {
        const newLineTop = currentTop;
        lastLineTopRef.current = newLineTop;

        // Find words on previous lines
        const wordsOnPreviousLines = [];

        for (let i = 0; i < currentVisibleIndex; i++) {
          const wordEl = wordElements[i];
          if (!wordEl) continue;

          if (wordEl.offsetTop < currentTop - lineChangeThreshold) {
            wordsOnPreviousLines.push(i);
          }
        }

        // Count distinct lines above current
        const linesAbove = new Set();
        wordsOnPreviousLines.forEach((idx) => {
          const wordTop = wordElements[idx].offsetTop;
          const lineNumber = Math.round(wordTop / lineHeightRef.current);
          linesAbove.add(lineNumber);
        });

        // Only scroll if 2+ lines above (keeps user on middle line)
        if (linesAbove.size >= 2 && wordsOnPreviousLines.length > 0) {
          let minTop = Infinity;
          wordsOnPreviousLines.forEach((idx) => {
            const wordTop = wordElements[idx].offsetTop;
            if (wordTop < minTop) minTop = wordTop;
          });

          const topLineWords = wordsOnPreviousLines.filter((idx) => {
            const wordTop = wordElements[idx].offsetTop;
            return Math.abs(wordTop - minTop) < 5;
          });

          if (topLineWords.length > 0) {
            const lastWordOfTopLine = Math.max(...topLineWords);
            const newVisibleStart = visibleStartIndex + lastWordOfTopLine + 1;

            // Instant line jump
            setTranslateY(-lineHeightRef.current);

            setTimeout(() => {
              setVisibleStartIndex(newVisibleStart);
              setTranslateY(0);
              lastLineTopRef.current = 0;
            }, 0);
          }
        }
      }
    }, [currentWordIndex, visibleStartIndex, visibleWords.length]);

    // Get color class for a letter based on its state
    const getLetterClass = (charIndex) => {
      const isCurrentChar = charIndex === currentIndex;

      if (charIndex < currentIndex) {
        if (errors.has(charIndex)) {
          return "letter-incorrect";
        }
        return "letter-correct";
      } else if (isCurrentChar) {
        return "letter-current";
      }
      return "letter-untyped";
    };

    // Check if current position is a space
    const isCurrentPositionSpace = () => {
      return currentIndex < content.length && content[currentIndex] === " ";
    };

    // Get cursor display position
    const getCursorPosition = () => {
      if (isCurrentPositionSpace() && currentIndex > 0) {
        return currentIndex - 1;
      }
      return currentIndex;
    };

    // Render a single word with its letters
    const renderWord = (word, wordIndex) => {
      const actualWordIndex = visibleStartIndex + wordIndex;
      const isActive = actualWordIndex === currentWordIndex;
      const hasError = Array.from(errors).some(
        (errorIdx) => errorIdx >= word.startIndex && errorIdx <= word.endIndex
      );

      const cursorPos = getCursorPosition();
      const isAtSpace = isCurrentPositionSpace();
      const isThisWordBeforeSpace = isAtSpace && word.endIndex === cursorPos;

      return (
        <div
          key={`word-${actualWordIndex}-${word.startIndex}`}
          className={`word ${isActive ? "active" : ""} ${
            hasError ? "error" : ""
          }`}
          data-wordindex={actualWordIndex}
          style={{ position: "relative" }}
          role="group"
          aria-label={`Word: ${word.text}`}
        >
          {word.text.split("").map((char, letterIdx) => {
            const charIndex = word.startIndex + letterIdx;
            const letterClass = getLetterClass(charIndex);
            const shouldShowCursorOnLetter =
              charIndex === cursorPos && !isAtSpace;

            return (
              <span
                key={`letter-${charIndex}`}
                className={`letter ${letterClass}`}
                data-index={charIndex}
                style={{ position: "relative" }}
                aria-label={
                  letterClass === "letter-correct"
                    ? "correct"
                    : letterClass === "letter-incorrect"
                    ? "incorrect"
                    : undefined
                }
              >
                {char}
                {shouldShowCursorOnLetter && (
                  <span
                    className="caret"
                    style={{
                      backgroundColor:
                        theme.css?.["--theme-cursor"] || "#3b82f6",
                    }}
                    aria-hidden="true"
                  />
                )}
              </span>
            );
          })}
          {/* Cursor after last letter when at space */}
          {isThisWordBeforeSpace && (
            <span
              className="caret"
              style={{
                position: "absolute",
                right: "-2px",
                top: "25%",
                height: "65%",
                width: "2px",
                backgroundColor: theme.css?.["--theme-cursor"] || "#3b82f6",
                animation: "caretBlink 1s ease-in-out infinite",
                borderRadius: "2px",
              }}
              aria-hidden="true"
            />
          )}
        </div>
      );
    };

    const fontStyle = { fontFamily: getTypingFontFamily() };

    return (
      <div
        ref={containerRef}
        className={`monkeytype-container ${getTypingFontSize()}`}
        style={{
          ...fontStyle,
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
        role="textbox"
        aria-label="Typing practice text"
        aria-readonly="true"
      >
        <div
          ref={wordsRef}
          id="words"
          className="words-wrapper"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0",
            alignItems: "flex-start",
            transform: `translateY(${translateY}px)`,
            position: "relative",
          }}
        >
          {visibleWords.map((word, index) => renderWord(word, index))}
        </div>
      </div>
    );
  }
);

SwiftTypeDisplay.displayName = "SwiftTypeDisplay";

export default SwiftTypeDisplay;
