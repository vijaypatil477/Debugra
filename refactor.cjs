const fs = require('fs');
let c = fs.readFileSync('src/components/Chat/ChatPanel.jsx', 'utf8');

c = c.replace(
  "import ChatMessage from './ChatMessage';",
  "import ChatMessage from './ChatMessage';\nimport ChatHeader from './ChatHeader';\nimport ChatInput from './ChatInput';"
);

c = c.replace(
  /\{\/\* Header \*\/}.*?\{\/\* Messages \*\/}/s,
  "<ChatHeader roomId={roomId} onDownloadReport={handleDownloadReport} onToggle={onToggle} />\n\n          {/* Messages */}"
);

c = c.replace(
  /\{\/\* Input \*\/}.*?<\/div>\n      \)\}\n    <\/>/s,
  "{/* Input */}\n          <ChatInput ref={inputRef} input={input} setInput={setInput} handleSend={handleSend} />\n        </div>\n      )}\n    </>"
);

fs.writeFileSync('src/components/Chat/ChatPanel.jsx', c);
