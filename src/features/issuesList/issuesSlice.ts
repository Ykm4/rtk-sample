import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Links } from 'parse-link-header'

import { Issue, IssuesResult, getIssue, getIssues } from 'api/githubAPI'
import { AppThunk } from 'app/store'

interface IssuesState {
  issuesByNumber: Record<number, Issue>
  currentPageIssues: number[]
  pageCount: number
  pageLinks: Links | null
  isLoading: boolean
  error: string | null
}

const issuesInitialState: IssuesState = {
  issuesByNumber: {},
  currentPageIssues: [],
  pageCount: 0,
  pageLinks: {},
  isLoading: false,
  error: null
}

// getIssueStart, getIssuesStartで同じ処理を行っているため関数として切り分けて再利用可能にしている
// また、関数として切り分けが出来ていた方がテストコードが書きやすい
const startLoading = (state: IssuesState) => {
  state.isLoading = true
}

function loadingFailed(state: IssuesState, action: PayloadAction<string>) {
  state.isLoading = false
  state.error = action.payload
}

const issues = createSlice({
  name: 'issues',
  initialState: issuesInitialState,
  reducers: {
    // Issue
    getIssueStart: startLoading,
    // Issues
    getIssuesStart: startLoading,
    getIssueSuccess(state, { payload }: PayloadAction<Issue>) {
      const { number } = payload
      state.issuesByNumber[number] = payload
      state.isLoading = false
      state.error = null
    },
    getIssuesSuccess(state, { payload }: PayloadAction<IssuesResult>) {
      const { pageCount, issues, pageLinks } = payload
      state.pageCount = pageCount
      state.pageLinks = pageLinks
      state.isLoading = false
      state.error = null

      issues.forEach(issue => {
        state.issuesByNumber[issue.number] = issue
      })

      state.currentPageIssues = issues.map(issue => issue.number)
    },
    getIssueFailure: loadingFailed,
    getIssuesFailure: loadingFailed
  }
})

export const {
  getIssuesStart,
  getIssuesSuccess,
  getIssueStart,
  getIssueSuccess,
  getIssueFailure,
  getIssuesFailure
} = issues.actions

export default issues.reducer

export const fetchIssues = (
  org: string,
  repo: string,
  page?: number
): AppThunk => async dispatch => {
  try {
    dispatch(getIssuesStart())
    const issues = await getIssues(org, repo, page)
    dispatch(getIssuesSuccess(issues))
  } catch (err) {
    dispatch(getIssuesFailure(err.toString()))
  }
}

export const fetchIssue = (
  org: string,
  repo: string,
  number: number
): AppThunk => async (dispatch, getState, extraArgument) => {
  // AppThunkの型付けを修正すればextraArgumentとしてrejectWithValuesなどが取れる
  console.log('extraArgument', extraArgument)
  try {
    // plain action creatorsを返している
    dispatch(getIssueStart())
    const issue = await getIssue(org, repo, number)
    dispatch(getIssueSuccess(issue))
  } catch (err) {
    dispatch(getIssueFailure(err.toString()))
  }
}
