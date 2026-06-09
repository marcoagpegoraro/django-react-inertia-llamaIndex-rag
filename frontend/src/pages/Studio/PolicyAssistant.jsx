import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Head, router, useForm } from "@inertiajs/react";
import { useEffect } from "react";

import AppShell from "../../layouts/AppShell";

function MetaRow({ label, value }) {
  return (
    <ListItem disableGutters divider>
      <ListItemText primary={label} secondary={value || "Not available yet"} />
    </ListItem>
  );
}

function SourceCard({ source }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Typography variant="subtitle1">{source.section}</Typography>
          <Chip label={`Score ${source.score}`} size="small" variant="outlined" />
        </Stack>

        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
          {source.excerpt}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function PolicyAssistant({
  answerResult,
  assistantError,
  assistantMeta,
  examples,
  question,
  questionError,
  routes,
}) {
  const form = useForm({ question: question || "" });

  useEffect(() => {
    form.setData("question", question || "");
  }, [question]);

  const submit = (event) => {
    event.preventDefault();
    router.get(
      routes.policyAssistant,
      { question: form.data.question },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  const runExample = (example) => {
    form.setData("question", example);
    router.get(
      routes.policyAssistant,
      { question: example },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  return (
    <>
      <Head title="Policy assistant" />

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
            >
              <Box>
                <Typography variant="h5">Company policy RAG demo</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  This page shows Django calling a LlamaIndex retrieval flow over a local
                  Chroma vector store built from a simple text file.
                </Typography>
              </Box>
              <Chip
                color="primary"
                icon={<StorageRoundedIcon />}
                label={assistantMeta.generationMode}
                variant="outlined"
              />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <List disablePadding>
              <MetaRow label="Policy file" value={assistantMeta.policyFile} />
              <MetaRow label="Chroma collection" value={assistantMeta.collectionName} />
              <MetaRow label="Indexed chunks" value={String(assistantMeta.chunkCount)} />
              <MetaRow label="Last indexed" value={assistantMeta.lastIndexedAt} />
            </List>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.9fr)" },
          }}
        >
          <Card>
            <CardHeader
              subheader="The input is sent back to Django through Inertia, then the backend retrieves the most relevant policy chunks before composing the answer."
              title="Ask the policy"
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack component="form" spacing={2} onSubmit={submit}>
                <TextField
                  multiline
                  minRows={3}
                  label="Question"
                  value={form.data.question}
                  error={Boolean(questionError)}
                  helperText={questionError || "Try asking about PTO, expenses, remote work, or security."}
                  onChange={(event) => form.setData("question", event.target.value)}
                />

                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!form.data.question.trim()}
                  >
                    Ask Django
                  </Button>
                  <Button variant="text" onClick={() => router.get(routes.policyAssistant)}>
                    Clear
                  </Button>
                </Stack>

                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Example prompts
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {examples.map((example) => (
                      <Button
                        key={example}
                        size="small"
                        startIcon={<PlayArrowRoundedIcon />}
                        variant="outlined"
                        onClick={() => runExample(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              subheader="The vector store is persisted locally, so Django can reuse it between requests."
              title="What the backend is doing"
            />
            <CardContent sx={{ pt: 0 }}>
              <List disablePadding>
                <MetaRow label="1. Source file" value="studio/data/company_policy.txt" />
                <MetaRow label="2. Indexing" value="LlamaIndex chunks the policy into searchable nodes" />
                <MetaRow label="3. Storage" value="Chroma persists the embeddings under .rag/chroma" />
                <MetaRow label="4. Response" value="Django returns the answer and supporting excerpts to React" />
              </List>
            </CardContent>
          </Card>
        </Box>

        {assistantError ? (
          <Alert severity="error" variant="outlined">
            {assistantError}
          </Alert>
        ) : null}

        {answerResult ? (
          <Stack spacing={3}>
            <Card>
              <CardHeader
                subheader={`Question: ${answerResult.question}`}
                title="Answer"
              />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body1">{answerResult.answer}</Typography>
              </CardContent>
            </Card>

            <Stack spacing={2}>
              <Typography variant="h6">Retrieved policy excerpts</Typography>
              {answerResult.sources.length > 0 ? (
                answerResult.sources.map((source, index) => (
                  <SourceCard key={`${source.section}-${index}`} source={source} />
                ))
              ) : (
                <Alert severity="info" variant="outlined">
                  No supporting excerpts were returned for this question.
                </Alert>
              )}
            </Stack>
          </Stack>
        ) : (
          <Alert severity="info" variant="outlined">
            Ask a policy question to see Django call the RAG pipeline and return retrieved
            context.
          </Alert>
        )}
      </Stack>
    </>
  );
}

PolicyAssistant.layout = (page) => <AppShell>{page}</AppShell>;
