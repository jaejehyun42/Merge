import { setupTournament } from "./tournament.js";
import { startGameLoop, stopGameLoop } from "../games/loop.js";
import { loadLanguage } from "../locales/lang";

document.addEventListener("showGameOptions", () => {
	setupGame();
});

export let player1 = "Nick Name";

export const gamePage = `
	<!-- 오버레이 추가 -->
	<div id="overlay" class="fixed top-0 left-0 z-40 w-full h-full bg-black opacity-0 hidden transition-opacity duration-300"></div>

	<!-- 토글 버튼 -->
	<button id="menu-toggle" class="fixed top-5 left-5 z-50 w-10 h-10 text-xl text-white rounded-lg 2xl:hidden" 
		style="background-color: rgba(45, 45, 248, 0.3);">
		☰
	</button>

	<!-- 닫기 버튼 -->
	<button id="close-toggle" class="fixed top-6 left-64 z-50 w-10 h-10 text-xl text-white rounded-r-lg hidden 2xl:hidden" 
		style="background-color: rgba(248, 45, 45, 0.3);">
		✖
	</button>

	<!-- 반응형 사이드바 -->
	<aside id="sidebar"
		class="fixed top-0 z-50 left-0 w-64 h-full bg-white shadow-lg p-4 flex flex-col items-center space-y-4
		transform -translate-x-full transition-transform duration-300 2xl:translate-x-0 2xl:relative">

		<!-- 페이지 제목 -->
		<h1 class="mt-2 mb-6 text-5xl text-center font-bold text-blue-600">PONG</h1>
	
		<!-- 유저 아바타 및 이름 -->
		<div class="flex flex-col mt-2 items-center">
			<img id="user-avatar" src="" class="w-35 h-35 rounded-full border border-gray-300">
			<p id="user-nickname" class="mt-4 mb-8 text-xl font-semibold text-gray-700"></p>
		</div>
	
		<!-- 네비게이션 버튼 -->
		<button data-i18n="dashboard" id="dashboard" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="home"></button>
		<button data-i18n="game" id="game" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="game"></button>
		<button data-i18n="editprofilenoemoge" id="profile" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="status"></button>

		<!-- 언어 변경 버튼 (사이드바 하단) -->
		<div class="mt-auto mb-4">
			<button id="lang-toggle" class="flex items-center px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-300 transition duration-300">
				<!-- 버튼 내용은 동적으로 추가 -->
			</button>
		</div>
	</aside>

	<!-- 메인 콘텐츠 영역 -->
	<main class="flex-1 flex">
		<div id="content" class="flex-1 bg-white p-6 rounded-lg shadow-md m-4"></div>
	</main>

`;

export function setPlayer1(nickname: string)
{
	player1 = nickname;
}

// 게임 옵션 선택 화면 렌더링
export async function setupGame()
{
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="selectmode" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2">
			</h2>
			
			<!-- 버튼 -->
			<div class="flex flex-col space-y-6 justify-center items-center flex-grow">
				<button data-i18n="localmatch" id="local-mode" class="btn bg-blue-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-blue-600 transition duration-300">
				</button>
				<button data-i18n="aimatch" id="ai-mode" class="btn bg-green-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-green-600 transition duration-300">
				</button>
				<button data-i18n="tournament" id="tournament-mode" class="btn bg-red-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-red-600 transition duration-300">
				</button>
			</div>
		</div>

		<!-- 닉네임 입력 모달 -->
		<div id="nickname-modal-wrapper" class="absolute inset-0 z-60 hidden flex items-center justify-center"
			style="background-color: rgba(0, 0, 0, 0.45)">
			<div id="nickname-modal" class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
				<h3 class="text-2xl font-semibold mb-4">Enter 2P's Nickname</h3>
				<input type="text" id="player2-name" placeholder="Local Player" class="border px-4 py-2 mb-4 w-full">
				<div class="flex space-x-4">
					<button id="start-local-game" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Start</button>
					<button id="close-modal" class="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancel</button>
				</div>
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	document.getElementById("local-mode")!.addEventListener("click", () => {
		document.getElementById("nickname-modal-wrapper")!.classList.remove("hidden");
	});
	document.getElementById("start-local-game")!.addEventListener("click", async () => {
		const player2 = (document.getElementById("player2-name") as HTMLInputElement).value.trim() || "Local Player";
		document.getElementById("nickname-modal-wrapper")!.classList.add("hidden");

		if (player1 === player2)
		{
			alert(`Duplicate nickname: "${player2}". Please use a unique nickname.`);
			return;
		}
		await startGame(player1, player2)
		setupGame();
	});
	document.getElementById("ai-mode")!.addEventListener("click", async () => {
		await startGame(player1, "AI")
		setupGame();
	});
	document.getElementById("tournament-mode")!.addEventListener("click", async () => {
		setupTournament(player1)
	});
	document.getElementById("close-modal")!.addEventListener("click", () => {
		document.getElementById("nickname-modal-wrapper")!.classList.add("hidden");
	});
}

export async function startGame(player1: string, player2: string): Promise<string>
{
	stopGameLoop();
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	if (player1.startsWith("AI"))
		[player1, player2] = [player2, player1];

	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="game" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2">
			</h2>

			<div class="flex flex-col space-y-6 justify-center items-center flex-grow">
				<!-- 플레이어 닉네임 -->
				<div id="scoreBoard" class="text-2xl font-bold">${player1} | ${player2}</div>
				<!-- 게임 캔버스 -->
				<canvas id="gameCanvas" width="1200" height="600" class="border-2 border-black"></canvas>
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas)
		throw new Error("🚨 Error: Cannot find gameCanvas element!");

	let result: { [key:string]: string | null };
	if (player1.startsWith("AI") || player2.startsWith("AI"))
		result = await startGameLoop(canvas, player1, player2, "PvE");
	else
		result = await startGameLoop(canvas, player1, player2, "PvP");
	sendMatchResult(result);

	if (result["winner"])
		return result["winner"];
	else
		return "???";
}

async function sendMatchResult(result: { [key: string]: string | null })
{
	const dataToSend = {
		user1: result["name_1p"] || '',
		user2: result["name_2p"] || '',
		user1_score: result["score_1p"] || '0',
		user2_score: result["score_2p"] || '0'
	};
	
	try {
		const response = await fetch('/api/match-results', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(dataToSend),
		});
	
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	
		const data = await response.json();
		console.log('Match result sent successfully:', data);
	}
	catch (error) {
		console.error('Error sending match result:', error);
	}
}