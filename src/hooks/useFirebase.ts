import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type User } from "firebase/auth"; //FirebaseSDKのemailログイン機能
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../utils/firebase"; //Firebaseクライアントから認証機能のインポート
import type { StudyData } from "../types/studyData";

type useFirebase = () => {
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    email: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    handleLogin: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
    user: User | null; //FirebaseSDKによるUser型またはNull
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    learnings: StudyData[]; //Firestoreから取得する学習記録の配列、studyDataの型データによる配列
    setLearnings: React.Dispatch<React.SetStateAction<StudyData[]>>;
    fetchDb: (data: string) => Promise<void>
    calculateTotalTime: () => number
    updateDb: (data: StudyData) => Promise<void>
    entryDb: (data: StudyData) => Promise<void>
    deleteDb: (data: StudyData) => Promise<void>;
    handleLogout: () => Promise<void>
    passwordConf: string
    setPasswordConf: React.Dispatch<React.SetStateAction<string>>
    handleSignup: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>
}

export const useFirebase: useFirebase = () => {

    const [loading, setLoading] = useState(false); //ローディング状態を管理するstateの定義
    const [email, setEmail] = useState(''); //emailを管理
    const [password, setPassword] = useState(''); //passwordを管理
    const [passwordConf, setPasswordConf] = useState(''); //password確認用
    const [user, setUser] = useState<User | null>(null); //セッションユーザ情報のステート追加
    const [learnings, setLearnings] = useState<StudyData[]>([]); //学習記録データのステート追加
    const navigate = useNavigate() //React RouterのNavigate機能
    const toast = useToast() //Chakra UIのToastを利用

    //Authentication
    //ログイン処理
    const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault(); // submitイベントの本来の動作を抑止
        setLoading(true); //ローディングをローディング状態に
        try {
            const userLogin = await signInWithEmailAndPassword(auth, email, password);
            console.log("User Logined:", userLogin);
            toast({//処理が正常終了すれば、Chakra UIのToastを利用し、ログイン成功メッセージを表示
                title: 'ログインしました',
                position: 'top',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
            navigate('/') //ログイン成功後、Home画面('/')に遷移
        }
        catch (error) {//エラー時はChakra UIのToastを利用し、エラーメッセージを表示
            console.error("Error during sign up", error);
            toast({
                title: 'ログインに失敗しました',
                description: `${error}`,
                position: 'top',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
        }
        finally {
            setLoading(false); //最終処理としてローディング状態を解除
        }
    };

    // ユーザがセッション中か否かの判定処理
    useEffect(() => {
        const unsubscribed = auth.onAuthStateChanged((user) => {
            setUser(user); //userはnullかUserオブジェクト
            if (user) {
                setEmail(user.email as string);
            } else {
                //認証が不要なページのパスリスト
                const authNotRequiredPaths = ["/login", "/register", "/setReset"];
                //現在のパスを取得
                const currentPath = window.location.pathname;

                //現在のパスが認証不要なページでない場合のみリダイレクト
                if (!authNotRequiredPaths.includes(currentPath)) {
                    navigate("/login"); //userがセッション中でなければ/loginに移動
                }
            }
        });
        return () => {
            unsubscribed();
        };
    }, [user]);

    // ログアウト処理
    const handleLogout = async () => {
        setLoading(true);
        try {
            const userLogout = await auth.signOut();
            console.log('User Logout:', userLogout);
            toast({
                title: 'ログアウトしました',
                position: 'top',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
            navigate('/login');
        }
        catch (error) {
            console.error('Error during logout:', error);
            toast({
                title: 'ログアウトに失敗しました',
                description: `${error}`,
                position: 'top',
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
        finally {
            setLoading(false);
        }
    }

    // サインアップ処理
    const handleSignup = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== passwordConf) {
            toast({
                title: 'パスワードが一致しません',
                position: 'top',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
            return;
        } else if (password.length < 6) {
            toast({
                title: 'パスワードは6文字以上にしてください',
                position: 'top',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
            return;
        }
        try {
            setLoading(true);
            // Firebaseにユーザーを作成する処理
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User Created:", userCredential);
            toast({
                title: 'ユーザー登録が完了しました',
                position: 'top',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
            navigate('/login'); //ユーザー登録後、ログイン画面に遷移
        }
        catch (error) {
            console.error("Error during sign up", error);
            toast({
                title: 'サインアップに失敗しました',
                description: `${error}`,
                position: 'top',
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
        finally {
            setLoading(false);
        }
    }

    ////Firestore
    //Firestoreデータ取得
    const fetchDb = async (data: string) => {
        setLoading(true);
        try {
            const usersCollectionRef = collection(db, 'users_learnings');
            const q = query(usersCollectionRef, where('email', '==', data)); //ログインユーザのemailでフィルター
            const querySnapshot = await getDocs(q);
            const fetchedLearnings = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            } as StudyData)); //Firebaseから取得したデータを`StudyData`型に明示的に変換
            setLearnings(fetchedLearnings); //正しい型でセット
        }
        catch (error) {
            console.error("Error getitng documents: ", error);
        }
        finally {
            setLoading(false);
        }
    }

    //Firestoreデータ更新
    const updateDb = async (data: StudyData) => {
        setLoading(true)
        try {
            const userDocumentRef = doc(db, 'users_learnings', data.id);
            await updateDoc(userDocumentRef, {
                title: data.title,
                time: data.time
            });
            toast({
                title: '学習記録を更新しました',
                position: 'top',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        }
        catch (error) {
            console.log(error)
            toast({
                title: '学習記録の更新に失敗しました',
                description: `${error}`,
                position: 'top',
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        } finally {
            setLoading(false)
        }
    }

    //Firestoreデータ新規登録
    const entryDb = async (data: StudyData) => {
        setLoading(true)
        try {
            const usersCollectionRef = collection(db, 'users_learnings');
            const documentRef = await addDoc(usersCollectionRef, {
                title: data.title,
                time: data.time,
                email: email
            });
            console.log(documentRef, data);
            toast({
                title: 'データ登録が完了しました',
                position: 'top',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        }
        catch (error) {
            console.error("Error adding document:", error);
            toast({
                title: 'データ登録に失敗しました',
                description: `${error}`,
                position: 'top',
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        } finally {
            setLoading(false)
        }
    }

    //Firestoreデータ削除
    const deleteDb = async (data: StudyData) => {
        setLoading(true);
        try {
            const userDocmentRef = doc(db, 'users_learnings', data.id);
            await deleteDoc(userDocmentRef);
            toast({
                title: 'データを削除しました',
                position: 'top',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        }
        catch (error) {
            console.error("Error during delete:", error);
            toast({
                title: 'データの削除に失敗しました',
                description: `${error}`,
                position: 'top',
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
        finally {
            setLoading(false);
        }
    }

    //学習時間合計
    const calculateTotalTime = () => {
        return learnings.reduce((total, learning) => total + learning.time, 0);
    };

    return {
        loading,
        setLoading,
        email,
        setEmail,
        password,
        setPassword,
        handleLogin,
        user,
        setUser,
        learnings,
        setLearnings,
        fetchDb,
        calculateTotalTime,
        updateDb,
        entryDb,
        deleteDb,
        handleLogout,
        passwordConf,
        setPasswordConf,
        handleSignup
    }
}