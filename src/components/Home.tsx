import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { FiEdit } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { useFirebase } from "../hooks/useFirebase";
import { type StudyData } from "../types/studyData";

const Home = () => {
  const {
    loading,
    user,
    email,
    learnings,
    fetchDb,
    calculateTotalTime,
    updateDb,
  } = useFirebase();
  const modalEdit = useDisclosure();
  const initialRef = useRef(null);
  const [editLearning, setEditLearning] = useState<StudyData>({
    id: "",
    title: "",
    time: 0,
  });
  const toast = useToast();

  useEffect(() => {
    if (user) {
      fetchDb(email);
      console.log("Firestore", email);
    }
  }, [user]);

  const handleUpdate = async () => {
    await updateDb(editLearning);
    fetchDb(email);
    if (!loading) {
      setTimeout(() => {
        modalEdit.onClose();
      }, 500);
    }
  };

  return (
    <>
      <Flex alignItems="center" justify="center" p={5}>
        <Card size={{ base: "sm", md: "lg" }}>
          <Box textAlign="center" mb={2} mt={10}>
            ようこそ！{email} さん
          </Box>
          <Heading size="md" textAlign="center">
            Learning Records
          </Heading>
          <CardBody>
            <Box textAlign="center">
              学習記録
              {
                loading && (
                  <Box p={10}>
                    <Spinner />
                  </Box>
                ) //ローディング中であれば<Spinner />を表示
              }
              <TableContainer>
                <Table variant="simple" size={{ base: "sm", md: "lg" }}>
                  <Thead>
                    <Tr>
                      <Th>学習内容</Th>
                      <Th>時間(分)</Th>
                      <Th></Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {learnings.map((learning, index) => (
                      <Tr key={index}>
                        <Td>{learning.title}</Td>
                        <Td>{learning.time}</Td>
                        <Td>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditLearning(learning);
                              modalEdit.onOpen();
                            }}
                          >
                            <FiEdit color="black" />
                          </Button>

                          <Modal
                            initialFocusRef={initialRef}
                            isOpen={modalEdit.isOpen}
                            onClose={modalEdit.onClose}
                          >
                            <ModalOverlay />
                            <ModalContent>
                              <ModalHeader>記録編集</ModalHeader>
                              <ModalCloseButton />
                              <ModalBody pb={6}>
                                <FormControl>
                                  <FormLabel>学習内容</FormLabel>
                                  <Input
                                    ref={initialRef}
                                    placeholder="学習内容"
                                    name="title"
                                    value={editLearning.title}
                                    onChange={(e) => {
                                      setEditLearning({
                                        ...editLearning,
                                        title: e.target.value,
                                      });
                                    }}
                                  />
                                </FormControl>

                                <FormControl mt={4}>
                                  <FormLabel>学習時間</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="学習時間"
                                    name="time"
                                    value={editLearning.time}
                                    onChange={(e) => {
                                      setEditLearning({
                                        ...editLearning,
                                        time: Number(e.target.value),
                                      });
                                    }}
                                  />
                                </FormControl>
                                <div>
                                  入力されている学習内容：{editLearning.title}
                                </div>
                                <div>
                                  入力されている学習時間：{editLearning.time}
                                </div>
                              </ModalBody>
                              <ModalFooter>
                                <Button
                                  isLoading={loading}
                                  loadingText="Loading"
                                  spinnerPlacement="start"
                                  colorScheme="green"
                                  mr={3}
                                  onClick={() => {
                                    if (
                                      editLearning.title !== "" &&
                                      editLearning.time > 0
                                    ) {
                                      handleUpdate();
                                    } else {
                                      toast({
                                        title:
                                          "学習内容と時間を入力してください",
                                        position: "top",
                                        status: "error",
                                        duration: 2000,
                                        isClosable: true,
                                      });
                                    }
                                  }}
                                >
                                  データを更新
                                </Button>
                                <Button
                                  onClick={() => {
                                    modalEdit.onClose();
                                  }}
                                >
                                  Cancel
                                </Button>
                              </ModalFooter>
                            </ModalContent>
                          </Modal>
                        </Td>
                        <Td>
                          <Button variant="ghost">
                            <MdDelete color="black" />
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Box p={5}>
              <div>合計学習時間：{calculateTotalTime()}分</div>
            </Box>

            <Box p={25}>
              <Stack spacing={3}>
                <Button
                  colorScheme="green"
                  variant="outline"
                  onClick={() => {}}
                >
                  新規データ登録
                </Button>
              </Stack>
            </Box>
            <Box px={25} mb={4}>
              <Stack spacing={3}>
                <Button width="100%" variant="outline" onClick={() => {}}>
                  ログアウト
                </Button>
              </Stack>
            </Box>
            <Box px={25} mb={4}>
              <Stack spacing={3}>
                <Button width="100%" variant="outline" onClick={() => {}}>
                  パスワード更新
                </Button>
              </Stack>
            </Box>
          </CardBody>
        </Card>
      </Flex>
    </>
  );
};
export default Home;
